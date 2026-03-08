using Microsoft.EntityFrameworkCore;
using VoiceAgent.API.Data;
using VoiceAgent.API.Entities;

namespace VoiceAgent.API.Services;

public interface IAppointmentService
{
    Task<List<TimeOnly>> GetAvailableSlotsAsync(int tenantId, DateOnly date, int durationMinutes = 30);
    Task<Appointment> BookAppointmentAsync(int tenantId, string customerName, string? customerPhone,
        DateOnly date, TimeOnly time, string? serviceType, string? notes, int? callLogId = null);
    Task<List<Appointment>> GetUpcomingAsync(int tenantId, int days = 7);
    Task<List<Appointment>> GetByDateAsync(int tenantId, DateOnly date);
    Task<bool> CancelAsync(int appointmentId, int tenantId);
    Task<(bool hasConflict, string message)> CheckConflictAsync(int tenantId, DateOnly date, TimeOnly time, int durationMinutes = 30);
    Task<Appointment?> FindByCustomerAsync(int tenantId, string customerName, DateOnly? date = null);
    Task<Appointment?> RescheduleAsync(int tenantId, int appointmentId, DateOnly newDate, TimeOnly newTime);
}

public class AppointmentService : IAppointmentService
{
    private readonly AppDbContext _db;
    private readonly ILogger<AppointmentService> _logger;

    public AppointmentService(AppDbContext db, ILogger<AppointmentService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<List<TimeOnly>> GetAvailableSlotsAsync(int tenantId, DateOnly date, int durationMinutes = 30)
    {
        // Get business hours for the requested day
        var hours = await _db.BusinessHours
            .FirstOrDefaultAsync(h => h.TenantId == tenantId && h.DayOfWeek == date.DayOfWeek);

        if (hours == null || hours.IsClosed)
            return new List<TimeOnly>(); // Closed on this day

        // Get existing appointments for this date
        var existingAppointments = await _db.Appointments
            .Where(a => a.TenantId == tenantId && a.Date == date &&
                        a.Status != AppointmentStatus.Cancelled)
            .OrderBy(a => a.StartTime)
            .ToListAsync();

        // Generate all possible slots
        var slots = new List<TimeOnly>();
        var currentSlot = hours.OpenTime;
        var slotDuration = TimeSpan.FromMinutes(durationMinutes);

        // Turkey is UTC+3 — filter past slots when date is today
        var nowTurkey = DateTime.UtcNow.AddHours(3);
        var today = DateOnly.FromDateTime(nowTurkey);
        var nowTime = TimeOnly.FromDateTime(nowTurkey);

        while (currentSlot.Add(slotDuration) <= hours.CloseTime)
        {
            // Skip slots that have already passed today
            if (date == today && currentSlot <= nowTime)
            {
                currentSlot = currentSlot.Add(slotDuration);
                continue;
            }

            var slotEnd = currentSlot.Add(slotDuration);

            // Check if this slot conflicts with any existing appointment
            // Cap duration at 480 min to prevent bad data from blocking all slots
            var hasConflict = existingAppointments.Any(a =>
            {
                var cappedDuration = Math.Min(a.Duration, 480);
                var aptEnd = a.StartTime.Add(TimeSpan.FromMinutes(cappedDuration));
                return currentSlot < aptEnd && slotEnd > a.StartTime;
            });

            if (!hasConflict)
                slots.Add(currentSlot);

            currentSlot = currentSlot.Add(slotDuration);
        }

        return slots;
    }

    public async Task<Appointment> BookAppointmentAsync(int tenantId, string customerName,
        string? customerPhone, DateOnly date, TimeOnly time, string? serviceType, string? notes, int? callLogId = null)
    {
        // Normalize Turkish phone number: strip +90, leading 0, spaces, dashes
        if (!string.IsNullOrEmpty(customerPhone))
        {
            customerPhone = customerPhone.Replace(" ", "").Replace("-", "").Replace("(", "").Replace(")", "");
            if (customerPhone.StartsWith("+90"))
                customerPhone = customerPhone.Substring(3);
            if (customerPhone.StartsWith("90") && customerPhone.Length > 10)
                customerPhone = customerPhone.Substring(2);
            if (customerPhone.StartsWith("0"))
                customerPhone = customerPhone.Substring(1);
        }

        // Determine duration from service type if available
        int duration = 30;
        if (!string.IsNullOrEmpty(serviceType))
        {
            var service = await _db.ServiceTypes
                .FirstOrDefaultAsync(s => s.TenantId == tenantId &&
                    s.Name.ToLower().Contains(serviceType.ToLower()) && s.IsActive);
            if (service != null)
                duration = service.Duration;
        }

        var appointment = new Appointment
        {
            TenantId = tenantId,
            CustomerName = customerName,
            CustomerPhone = customerPhone,
            Date = date,
            StartTime = time,
            EndTime = time.Add(TimeSpan.FromMinutes(duration)),
            Duration = duration,
            ServiceType = serviceType,
            Notes = notes,
            Status = AppointmentStatus.Confirmed,
            BookedVia = callLogId.HasValue ? "ai_call" : "admin",
            CallLogId = callLogId
        };

        _db.Appointments.Add(appointment);

        // Müşteri kaydı oluştur/güncelle
        // Telefon varsa telefona göre eşleştir; yoksa sadece isimle kaydet
        if (!string.IsNullOrEmpty(customerPhone))
        {
            var customer = await _db.Customers
                .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.Phone == customerPhone);

            if (customer == null)
            {
                _db.Customers.Add(new Customer
                {
                    TenantId = tenantId,
                    Name = customerName,
                    Phone = customerPhone,
                    TotalCalls = 1,
                    LastCallAt = DateTime.UtcNow
                });
            }
            else
            {
                customer.Name = customerName; // Adı güncelle
                customer.TotalCalls++;
                customer.LastCallAt = DateTime.UtcNow;
            }
        }
        else if (!string.IsNullOrEmpty(customerName))
        {
            // Telefon yok ama isim var — isimsiz kayıt yoksa oluştur
            var existing = await _db.Customers
                .FirstOrDefaultAsync(c => c.TenantId == tenantId
                    && c.Phone == null
                    && c.Name.ToLower() == customerName.ToLower());

            if (existing == null)
            {
                _db.Customers.Add(new Customer
                {
                    TenantId = tenantId,
                    Name = customerName,
                    Phone = null,
                    TotalCalls = 1,
                    LastCallAt = DateTime.UtcNow
                });
            }
            else
            {
                existing.TotalCalls++;
                existing.LastCallAt = DateTime.UtcNow;
            }
        }

        await _db.SaveChangesAsync();

        _logger.LogInformation("📅 Appointment booked: {Customer} on {Date} at {Time} (Tenant: {TenantId})",
            customerName, date, time, tenantId);

        return appointment;
    }

    public async Task<List<Appointment>> GetUpcomingAsync(int tenantId, int days = 7)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var endDate = today.AddDays(days);

        return await _db.Appointments
            .Where(a => a.TenantId == tenantId &&
                        a.Date >= today && a.Date <= endDate &&
                        a.Status != AppointmentStatus.Cancelled)
            .OrderBy(a => a.Date).ThenBy(a => a.StartTime)
            .ToListAsync();
    }

    public async Task<List<Appointment>> GetByDateAsync(int tenantId, DateOnly date)
    {
        return await _db.Appointments
            .Where(a => a.TenantId == tenantId && a.Date == date &&
                        a.Status != AppointmentStatus.Cancelled)
            .OrderBy(a => a.StartTime)
            .ToListAsync();
    }

    public async Task<bool> CancelAsync(int appointmentId, int tenantId)
    {
        var appointment = await _db.Appointments
            .FirstOrDefaultAsync(a => a.Id == appointmentId && a.TenantId == tenantId);

        if (appointment == null) return false;

        appointment.Status = AppointmentStatus.Cancelled;
        await _db.SaveChangesAsync();

        _logger.LogInformation("❌ Appointment cancelled: {Id} (Tenant: {TenantId})", appointmentId, tenantId);
        return true;
    }

    public async Task<(bool hasConflict, string message)> CheckConflictAsync(
        int tenantId, DateOnly date, TimeOnly time, int durationMinutes = 30)
    {
        var endTime = time.Add(TimeSpan.FromMinutes(durationMinutes));

        // Load appointments for the day first, then check conflicts in memory
        // (TimeSpan.FromMinutes can't be translated to SQL)
        var dayAppointments = await _db.Appointments
            .Where(a => a.TenantId == tenantId &&
                a.Date == date &&
                a.Status != AppointmentStatus.Cancelled)
            .ToListAsync();

        var conflict = dayAppointments.FirstOrDefault(a =>
            time < a.StartTime.Add(TimeSpan.FromMinutes(a.Duration)) &&
            endTime > a.StartTime);

        if (conflict != null)
        {
            return (true, $"Time slot conflict with {conflict.CustomerName} at {conflict.StartTime:HH:mm}");
        }

        return (false, "");
    }

    public async Task<Appointment?> FindByCustomerAsync(int tenantId, string customerName, DateOnly? date = null)
    {
        var query = _db.Appointments
            .Where(a => a.TenantId == tenantId &&
                        a.Status != AppointmentStatus.Cancelled &&
                        a.CustomerName.ToLower().Contains(customerName.ToLower()));

        if (date.HasValue)
            query = query.Where(a => a.Date == date.Value);
        else
            query = query.Where(a => a.Date >= DateOnly.FromDateTime(DateTime.UtcNow.AddHours(3)));

        return await query.OrderBy(a => a.Date).ThenBy(a => a.StartTime).FirstOrDefaultAsync();
    }

    public async Task<Appointment?> RescheduleAsync(int tenantId, int appointmentId, DateOnly newDate, TimeOnly newTime)
    {
        var appointment = await _db.Appointments
            .FirstOrDefaultAsync(a => a.Id == appointmentId && a.TenantId == tenantId &&
                                      a.Status != AppointmentStatus.Cancelled);

        if (appointment == null) return null;

        appointment.Date = newDate;
        appointment.StartTime = newTime;
        appointment.EndTime = newTime.Add(TimeSpan.FromMinutes(appointment.Duration));
        await _db.SaveChangesAsync();

        _logger.LogInformation("🔄 Appointment rescheduled: {Id} to {Date} {Time} (Tenant: {TenantId})",
            appointmentId, newDate, newTime, tenantId);

        return appointment;
    }
}

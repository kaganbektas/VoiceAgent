using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VoiceAgent.API.Data;
using VoiceAgent.API.Entities;
using VoiceAgent.API.Services;

namespace VoiceAgent.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AppointmentController : ControllerBase
{
    private readonly IAppointmentService _appointments;
    private readonly AppDbContext _db;

    public AppointmentController(IAppointmentService appointments, AppDbContext db)
    {
        _appointments = appointments;
        _db = db;
    }

    private int TenantId => int.Parse(User.FindFirst("tenantId")?.Value ?? "0");

    public record BookRequest(string CustomerName, string? CustomerPhone, string Date, string Time, string? ServiceType, string? Notes);

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var apt = await _db.Appointments
            .Include(a => a.CallLog)
            .Where(a => a.Id == id && a.TenantId == TenantId)
            .FirstOrDefaultAsync();

        if (apt == null) return NotFound();

        return Ok(new
        {
            apt.Id, apt.CustomerName, apt.CustomerPhone,
            Date = apt.Date.ToString("yyyy-MM-dd"),
            StartTime = apt.StartTime.ToString("HH:mm"),
            EndTime = apt.EndTime?.ToString("HH:mm"),
            apt.Duration, apt.ServiceType, apt.Notes,
            Status = (int)apt.Status, apt.BookedVia, apt.CallLogId,
            CallSummary = apt.CallLog == null ? null : new
            {
                apt.CallLog.Summary,
                apt.CallLog.Transcript,
                apt.CallLog.Duration,
                StartedAt = apt.CallLog.StartedAt
            }
        });
    }

    [HttpGet("overdue")]
    public async Task<IActionResult> GetOverdue()
    {
        var todayTurkey = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(3));
        var overdue = await _db.Appointments
            .Where(a => a.TenantId == TenantId
                && a.Date < todayTurkey
                && (a.Status == AppointmentStatus.Pending || a.Status == AppointmentStatus.Confirmed))
            .OrderByDescending(a => a.Date)
            .ThenBy(a => a.StartTime)
            .Select(a => new
            {
                a.Id, a.CustomerName, a.CustomerPhone,
                Date = a.Date.ToString("yyyy-MM-dd"),
                StartTime = a.StartTime.ToString("HH:mm"),
                EndTime = a.EndTime == null ? (string?)null : a.EndTime.Value.ToString("HH:mm"),
                a.ServiceType, a.Notes, a.BookedVia,
                Status = (int)a.Status
            })
            .ToListAsync();
        return Ok(overdue);
    }

    [HttpGet("upcoming")]
    public async Task<IActionResult> GetUpcoming([FromQuery] int days = 7)
    {
        var appointments = await _appointments.GetUpcomingAsync(TenantId, days);
        return Ok(appointments);
    }

    [HttpGet("date/{date}")]
    public async Task<IActionResult> GetByDate(string date)
    {
        if (!DateOnly.TryParse(date, out var d))
            return BadRequest(new { error = "Invalid date format (use YYYY-MM-DD)" });

        var appointments = await _appointments.GetByDateAsync(TenantId, d);
        return Ok(appointments);
    }

    [HttpGet("availability/{date}")]
    public async Task<IActionResult> GetAvailability(string date, [FromQuery] int duration = 30)
    {
        if (!DateOnly.TryParse(date, out var d))
            return BadRequest(new { error = "Invalid date format" });

        var slots = await _appointments.GetAvailableSlotsAsync(TenantId, d, duration);
        return Ok(new { date, availableSlots = slots.Select(s => s.ToString("HH:mm")) });
    }

    [HttpPost]
    public async Task<IActionResult> Book([FromBody] BookRequest req)
    {
        if (!DateOnly.TryParse(req.Date, out var date))
            return BadRequest(new { error = "Invalid date format" });
        if (!TimeOnly.TryParse(req.Time, out var time))
            return BadRequest(new { error = "Invalid time format" });

        // Reject past dates (Turkey UTC+3)
        var todayTurkey = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(3));
        if (date < todayTurkey)
            return BadRequest(new { error = "Cannot book appointments in the past" });

        // Check for conflicts
        var (hasConflict, conflictMsg) = await _appointments.CheckConflictAsync(TenantId, date, time);
        if (hasConflict)
            return Conflict(new { error = conflictMsg });

        var appointment = await _appointments.BookAppointmentAsync(
            TenantId, req.CustomerName, req.CustomerPhone, date, time, req.ServiceType, req.Notes);

        return Created($"/api/appointment/{appointment.Id}", appointment);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Cancel(int id)
    {
        var result = await _appointments.CancelAsync(id, TenantId);
        return result ? Ok(new { message = "Appointment cancelled" }) : NotFound();
    }
}

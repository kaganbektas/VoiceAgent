namespace VoiceAgent.API.Entities;

public enum AppointmentStatus
{
    Pending,
    Confirmed,
    Cancelled,
    Completed,
    NoShow
}

public class Appointment
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public string? CustomerEmail { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public int Duration { get; set; } = 30; // minutes
    public string? ServiceType { get; set; }
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Pending;
    public string? Notes { get; set; }
    public string BookedVia { get; set; } = "ai_call"; // ai_call, admin, manual
    public int? CallLogId { get; set; }
    public bool ReminderSent { get; set; } = false;
    public bool ConfirmationSent { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public virtual Tenant Tenant { get; set; } = null!;
    public virtual CallLog? CallLog { get; set; }
}

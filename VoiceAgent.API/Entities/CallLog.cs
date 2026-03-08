namespace VoiceAgent.API.Entities;

public class CallLog
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string? TwilioCallSid { get; set; }
    public string CallerPhone { get; set; } = string.Empty;
    public string? TwilioNumber { get; set; }
    public string Direction { get; set; } = "inbound";
    public string Status { get; set; } = "in_progress"; // in_progress, completed, missed, failed
    public int Duration { get; set; } = 0; // seconds
    public string? Transcript { get; set; }
    public string? Summary { get; set; }
    public string? ActionsTaken { get; set; } // JSON
    public string? CustomerSentiment { get; set; } // positive, neutral, negative
    public string? RecordingUrl { get; set; }
    public decimal CostUsd { get; set; } = 0;
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public virtual Tenant Tenant { get; set; } = null!;
    public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}

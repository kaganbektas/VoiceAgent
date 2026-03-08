namespace VoiceAgent.API.Entities;

public class BusinessHours
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly OpenTime { get; set; } = new TimeOnly(9, 0);
    public TimeOnly CloseTime { get; set; } = new TimeOnly(17, 0);
    public bool IsClosed { get; set; } = false;

    // Navigation
    public virtual Tenant Tenant { get; set; } = null!;
}

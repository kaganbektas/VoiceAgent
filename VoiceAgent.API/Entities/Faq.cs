namespace VoiceAgent.API.Entities;

public class Faq
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public string? Category { get; set; } // hours, pricing, services, etc.
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public virtual Tenant Tenant { get; set; } = null!;
}

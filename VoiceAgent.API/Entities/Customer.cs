namespace VoiceAgent.API.Entities;

public class Customer
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Notes { get; set; }
    public int TotalCalls { get; set; } = 0;
    public DateTime? LastCallAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public virtual Tenant Tenant { get; set; } = null!;
}

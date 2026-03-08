namespace VoiceAgent.API.Entities;

public class ServiceType
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; } = string.Empty; // "Teeth Cleaning"
    public int Duration { get; set; } = 30; // minutes
    public decimal? Price { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public virtual Tenant Tenant { get; set; } = null!;
}

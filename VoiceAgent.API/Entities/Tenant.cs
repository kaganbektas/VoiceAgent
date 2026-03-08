namespace VoiceAgent.API.Entities;

public class Tenant
{
    public int Id { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Timezone { get; set; } = "America/New_York";
    public string Language { get; set; } = "en";
    public string? GreetingMessage { get; set; }
    public string? BusinessType { get; set; } // dental, salon, auto, etc.
    public string? Address { get; set; }
    public string? Description { get; set; } // "15 yıllık tecrübeli kuaför salonu..."
    public string? WebsiteUrl { get; set; }
    public string? TwilioPhoneNumber { get; set; }
    public string? TwilioPhoneSid { get; set; }
    public string? StripeCustomerId { get; set; }
    public string? StripeSubscriptionId { get; set; }
    public string SubscriptionPlan { get; set; } = "trial"; // trial, starter, pro, enterprise
    public string SubscriptionStatus { get; set; } = "trialing";
    public DateTime? TrialEndsAt { get; set; }
    public int MonthlyCallMinutes { get; set; } = 0;
    public int MonthlySmsCount { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public virtual ICollection<Customer> Customers { get; set; } = new List<Customer>();
    public virtual ICollection<CallLog> CallLogs { get; set; } = new List<CallLog>();
    public virtual ICollection<BusinessHours> BusinessHoursList { get; set; } = new List<BusinessHours>();
    public virtual ICollection<Faq> Faqs { get; set; } = new List<Faq>();
    public virtual ICollection<ServiceType> ServiceTypes { get; set; } = new List<ServiceType>();
}

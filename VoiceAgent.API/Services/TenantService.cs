using Microsoft.EntityFrameworkCore;
using VoiceAgent.API.Data;
using VoiceAgent.API.Entities;

namespace VoiceAgent.API.Services;

public interface ITenantService
{
    Task<Tenant?> GetByIdAsync(int tenantId);
    Task<Tenant?> GetByTwilioNumberAsync(string twilioNumber);
    Task<string> GetBusinessInfoTextAsync(int tenantId, string? infoType = "all");
    Task UpdateSettingsAsync(int tenantId, string? greeting, string? timezone, string? language);
    Task<List<BusinessHours>> GetBusinessHoursAsync(int tenantId);
    Task UpdateBusinessHoursAsync(int tenantId, List<BusinessHours> hours);
}

public class TenantService : ITenantService
{
    private readonly AppDbContext _db;

    public TenantService(AppDbContext db) { _db = db; }

    public async Task<Tenant?> GetByIdAsync(int tenantId) =>
        await _db.Tenants.FindAsync(tenantId);

    public async Task<Tenant?> GetByTwilioNumberAsync(string twilioNumber) =>
        await _db.Tenants.FirstOrDefaultAsync(t => t.TwilioPhoneNumber == twilioNumber && t.IsActive);

    private static readonly string[] TurkishDayNames =
        { "Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi" };

    public async Task<string> GetBusinessInfoTextAsync(int tenantId, string? infoType = "all")
    {
        var tenant = await _db.Tenants.FindAsync(tenantId);
        if (tenant == null) return "İşletme bilgisi bulunamadı.";

        var type = (infoType ?? "all").ToLowerInvariant().Trim();

        return type switch
        {
            "hours" or "saatler" or "çalışma saatleri" => await BuildHoursText(tenantId, tenant),
            "services" or "pricing" or "hizmetler" or "fiyatlar" or "fiyat" => await BuildServicesText(tenantId, tenant),
            "location" or "address" or "adres" or "konum" or "iletişim" => BuildLocationText(tenant),
            "faq" or "sss" or "sıkça sorulan sorular" => await BuildFaqText(tenantId),
            _ => await BuildFullProfileText(tenantId, tenant) // "all" or unrecognized → return everything
        };
    }

    private async Task<string> BuildFullProfileText(int tenantId, Tenant tenant)
    {
        var sb = new System.Text.StringBuilder();

        // Basic info
        sb.AppendLine($"İşletme Adı: {tenant.BusinessName}");
        if (!string.IsNullOrEmpty(tenant.BusinessType))
            sb.AppendLine($"İşletme Türü: {tenant.BusinessType}");
        if (!string.IsNullOrEmpty(tenant.Description))
            sb.AppendLine($"Açıklama: {tenant.Description}");
        if (!string.IsNullOrEmpty(tenant.Address))
            sb.AppendLine($"Adres: {tenant.Address}");
        if (!string.IsNullOrEmpty(tenant.Phone))
            sb.AppendLine($"Telefon: {tenant.Phone}");
        if (!string.IsNullOrEmpty(tenant.WebsiteUrl))
            sb.AppendLine($"Web Sitesi: {tenant.WebsiteUrl}");
        sb.AppendLine();

        // Hours
        var hoursText = await BuildHoursText(tenantId, tenant);
        sb.AppendLine(hoursText);

        // Services
        var servicesText = await BuildServicesText(tenantId, tenant);
        if (!string.IsNullOrEmpty(servicesText))
        {
            sb.AppendLine();
            sb.AppendLine(servicesText);
        }

        // FAQs
        var faqText = await BuildFaqText(tenantId);
        if (!string.IsNullOrEmpty(faqText))
        {
            sb.AppendLine();
            sb.AppendLine(faqText);
        }

        return sb.ToString();
    }

    private async Task<string> BuildHoursText(int tenantId, Tenant tenant)
    {
        var hours = await _db.BusinessHours
            .Where(h => h.TenantId == tenantId)
            .OrderBy(h => h.DayOfWeek)
            .ToListAsync();

        if (!hours.Any())
            return "Çalışma saatleri henüz belirlenmemiş.";

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("Çalışma Saatleri:");
        foreach (var h in hours)
        {
            var dayName = TurkishDayNames[(int)h.DayOfWeek];
            sb.AppendLine(h.IsClosed
                ? $"  {dayName}: Kapalı"
                : $"  {dayName}: {h.OpenTime:HH:mm} - {h.CloseTime:HH:mm}");
        }

        return sb.ToString();
    }

    private async Task<string> BuildServicesText(int tenantId, Tenant tenant)
    {
        var services = await _db.ServiceTypes
            .Where(s => s.TenantId == tenantId && s.IsActive)
            .ToListAsync();

        if (!services.Any())
            return "";

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("Hizmetler ve Fiyatlar:");
        foreach (var s in services)
        {
            var priceInfo = s.Price.HasValue ? $" - {s.Price:F0} ₺" : "";
            sb.AppendLine($"  • {s.Name} ({s.Duration} dk){priceInfo}");
        }

        return sb.ToString();
    }

    private static string BuildLocationText(Tenant tenant)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("İletişim Bilgileri:");

        if (!string.IsNullOrEmpty(tenant.Address))
            sb.AppendLine($"  Adres: {tenant.Address}");
        if (!string.IsNullOrEmpty(tenant.Phone))
            sb.AppendLine($"  Telefon: {tenant.Phone}");
        if (!string.IsNullOrEmpty(tenant.WebsiteUrl))
            sb.AppendLine($"  Web Sitesi: {tenant.WebsiteUrl}");
        if (!string.IsNullOrEmpty(tenant.Email))
            sb.AppendLine($"  E-posta: {tenant.Email}");

        return sb.ToString();
    }

    private async Task<string> BuildFaqText(int tenantId)
    {
        var faqs = await _db.Faqs
            .Where(f => f.TenantId == tenantId && f.IsActive)
            .ToListAsync();

        if (!faqs.Any())
            return "";

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("Sıkça Sorulan Sorular:");
        foreach (var f in faqs)
        {
            sb.AppendLine($"  S: {f.Question}");
            sb.AppendLine($"  C: {f.Answer}");
            sb.AppendLine();
        }

        return sb.ToString();
    }

    public async Task UpdateSettingsAsync(int tenantId, string? greeting, string? timezone, string? language)
    {
        var tenant = await _db.Tenants.FindAsync(tenantId);
        if (tenant == null) return;

        if (greeting != null) tenant.GreetingMessage = greeting;
        if (timezone != null) tenant.Timezone = timezone;
        if (language != null) tenant.Language = language;
        tenant.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
    }

    public async Task<List<BusinessHours>> GetBusinessHoursAsync(int tenantId) =>
        await _db.BusinessHours.Where(h => h.TenantId == tenantId).OrderBy(h => h.DayOfWeek).ToListAsync();

    public async Task UpdateBusinessHoursAsync(int tenantId, List<BusinessHours> hours)
    {
        var existing = await _db.BusinessHours.Where(h => h.TenantId == tenantId).ToListAsync();
        _db.BusinessHours.RemoveRange(existing);

        foreach (var h in hours)
        {
            h.TenantId = tenantId;
            _db.BusinessHours.Add(h);
        }

        await _db.SaveChangesAsync();
    }
}

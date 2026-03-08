using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoiceAgent.API.Entities;
using VoiceAgent.API.Services;

namespace VoiceAgent.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SettingsController : ControllerBase
{
    private readonly ITenantService _tenants;

    public SettingsController(ITenantService tenants) { _tenants = tenants; }

    private int TenantId => int.Parse(User.FindFirst("tenantId")?.Value ?? "0");

    public record UpdateSettingsRequest(string? GreetingMessage, string? Timezone, string? Language);
    public record BusinessHoursRequest(DayOfWeek DayOfWeek, string OpenTime, string CloseTime, bool IsClosed);

    [HttpGet]
    public async Task<IActionResult> GetSettings()
    {
        var tenant = await _tenants.GetByIdAsync(TenantId);
        if (tenant == null) return NotFound();

        var hours = await _tenants.GetBusinessHoursAsync(TenantId);

        return Ok(new
        {
            tenant.BusinessName,
            tenant.OwnerName,
            tenant.Email,
            tenant.GreetingMessage,
            tenant.Timezone,
            tenant.Language,
            tenant.BusinessType,
            tenant.TwilioPhoneNumber,
            tenant.SubscriptionPlan,
            tenant.SubscriptionStatus,
            tenant.TrialEndsAt,
            businessHours = hours.Select(h => new
            {
                h.DayOfWeek,
                openTime = h.OpenTime.ToString("HH:mm"),
                closeTime = h.CloseTime.ToString("HH:mm"),
                h.IsClosed
            })
        });
    }

    [HttpPut]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateSettingsRequest req)
    {
        await _tenants.UpdateSettingsAsync(TenantId, req.GreetingMessage, req.Timezone, req.Language);
        return Ok(new { message = "Settings updated" });
    }

    [HttpPut("hours")]
    public async Task<IActionResult> UpdateBusinessHours([FromBody] List<BusinessHoursRequest> req)
    {
        var hours = req.Select(r => new BusinessHours
        {
            DayOfWeek = r.DayOfWeek,
            OpenTime = TimeOnly.Parse(r.OpenTime),
            CloseTime = TimeOnly.Parse(r.CloseTime),
            IsClosed = r.IsClosed
        }).ToList();

        await _tenants.UpdateBusinessHoursAsync(TenantId, hours);
        return Ok(new { message = "Business hours updated" });
    }
}

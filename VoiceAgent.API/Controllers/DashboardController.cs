using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoiceAgent.API.Services;

namespace VoiceAgent.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IAppointmentService _appointments;
    private readonly ICallLogService _callLogs;
    private readonly ICustomerService _customers;
    private readonly ITenantService _tenants;

    public DashboardController(IAppointmentService appointments, ICallLogService callLogs,
        ICustomerService customers, ITenantService tenants)
    {
        _appointments = appointments;
        _callLogs = callLogs;
        _customers = customers;
        _tenants = tenants;
    }

    private int TenantId => int.Parse(User.FindFirst("tenantId")?.Value ?? "0");

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var todayAppointments = await _appointments.GetByDateAsync(TenantId, today);
        var recentCalls = await _callLogs.GetRecentAsync(TenantId, 100);
        var allCustomers = await _customers.GetAllAsync(TenantId);
        var tenant = await _tenants.GetByIdAsync(TenantId);

        var todayCalls = recentCalls.Count(c => c.StartedAt.Date == DateTime.UtcNow.Date);
        var completedCalls = recentCalls.Count(c => c.Status == "completed");
        var totalMinutes = recentCalls.Sum(c => c.Duration) / 60.0;

        return Ok(new
        {
            todayAppointments = todayAppointments.Count,
            todayCalls,
            totalCustomers = allCustomers.Count,
            callSuccessRate = recentCalls.Count > 0 ? (double)completedCalls / recentCalls.Count * 100 : 0,
            totalCallMinutes = Math.Round(totalMinutes, 1),
            monthlyCallMinutes = tenant?.MonthlyCallMinutes ?? 0,
            monthlySmsCount = tenant?.MonthlySmsCount ?? 0,
            subscriptionPlan = tenant?.SubscriptionPlan ?? "trial",
            recentActivity = recentCalls.Take(10).Select(c => new
            {
                c.Id,
                c.CallerPhone,
                c.Status,
                c.Duration,
                c.Summary,
                c.StartedAt
            })
        });
    }
}

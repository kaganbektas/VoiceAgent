using Microsoft.EntityFrameworkCore;
using VoiceAgent.API.Data;
using VoiceAgent.API.Entities;

namespace VoiceAgent.API.Services;

public interface ICallLogService
{
    Task<CallLog> StartCallAsync(int tenantId, string callerPhone, string? twilioCallSid, string? twilioNumber);
    Task EndCallAsync(int callLogId, string? transcript, string? summary, string? actionsTaken, string? sentiment);
    Task<List<CallLog>> GetRecentAsync(int tenantId, int count = 50);
    Task<CallLog?> GetByIdAsync(int id, int tenantId);
}

public class CallLogService : ICallLogService
{
    private readonly AppDbContext _db;
    private readonly ILogger<CallLogService> _logger;

    public CallLogService(AppDbContext db, ILogger<CallLogService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<CallLog> StartCallAsync(int tenantId, string callerPhone, string? twilioCallSid, string? twilioNumber)
    {
        var callLog = new CallLog
        {
            TenantId = tenantId,
            CallerPhone = callerPhone,
            TwilioCallSid = twilioCallSid,
            TwilioNumber = twilioNumber,
            Status = "in_progress",
            StartedAt = DateTime.UtcNow
        };

        _db.CallLogs.Add(callLog);
        await _db.SaveChangesAsync();

        _logger.LogInformation("📞 Call started: {CallerPhone} → {TwilioNumber} (Tenant: {TenantId})",
            callerPhone, twilioNumber, tenantId);

        return callLog;
    }

    public async Task EndCallAsync(int callLogId, string? transcript, string? summary,
        string? actionsTaken, string? sentiment)
    {
        var callLog = await _db.CallLogs.FindAsync(callLogId);
        if (callLog == null) return;

        callLog.Status = "completed";
        callLog.EndedAt = DateTime.UtcNow;
        callLog.Duration = (int)(DateTime.UtcNow - callLog.StartedAt).TotalSeconds;
        callLog.Transcript = transcript;
        callLog.Summary = summary;
        callLog.ActionsTaken = actionsTaken;
        callLog.CustomerSentiment = sentiment;

        // Calculate cost (approximate: Twilio + OpenAI per minute)
        var minutes = Math.Ceiling(callLog.Duration / 60.0);
        callLog.CostUsd = (decimal)(minutes * 0.15); // ~$0.15 per minute total

        await _db.SaveChangesAsync();

        _logger.LogInformation("📞 Call ended: {Id} | Duration: {Duration}s | Cost: ${Cost}",
            callLogId, callLog.Duration, callLog.CostUsd);
    }

    public async Task<List<CallLog>> GetRecentAsync(int tenantId, int count = 50)
    {
        return await _db.CallLogs
            .Where(c => c.TenantId == tenantId)
            .OrderByDescending(c => c.StartedAt)
            .Take(count)
            .ToListAsync();
    }

    public async Task<CallLog?> GetByIdAsync(int id, int tenantId)
    {
        return await _db.CallLogs
            .Include(c => c.Appointments)
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);
    }
}

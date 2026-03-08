using Microsoft.AspNetCore.Mvc;
using VoiceAgent.API.Services;
using Twilio.TwiML;

namespace VoiceAgent.API.Controllers;

/// <summary>
/// Twilio webhook controller — handles incoming phone calls.
/// This is NOT behind JWT auth because Twilio calls it directly.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class TwilioController : ControllerBase
{
    private readonly ITenantService _tenants;
    private readonly ICallLogService _callLogs;
    private readonly ILogger<TwilioController> _logger;
    private readonly IConfiguration _config;

    public TwilioController(ITenantService tenants, ICallLogService callLogs,
        ILogger<TwilioController> logger, IConfiguration config)
    {
        _tenants = tenants;
        _callLogs = callLogs;
        _logger = logger;
        _config = config;
    }

    /// <summary>
    /// Twilio sends a POST here when someone calls our phone number.
    /// We respond with TwiML to start a Media Stream (WebSocket audio).
    /// </summary>
    [HttpPost("voice")]
    public async Task<IActionResult> IncomingCall()
    {
        // Twilio sends form-encoded data
        var callerPhone = Request.Form["From"].ToString();
        var calledNumber = Request.Form["To"].ToString();
        var callSid = Request.Form["CallSid"].ToString();

        _logger.LogInformation("📞 Incoming call: {From} → {To} (CallSid: {CallSid})",
            callerPhone, calledNumber, callSid);

        // Find which tenant owns this phone number
        var tenant = await _tenants.GetByTwilioNumberAsync(calledNumber);

        // Fallback: Check if this is an outbound test call (From = Tenant)
        if (tenant == null)
        {
            var tenantByFrom = await _tenants.GetByTwilioNumberAsync(callerPhone);
            if (tenantByFrom != null)
            {
                tenant = tenantByFrom;
                _logger.LogInformation("🔄 Detected outbound test call. Swapping roles.");
                (callerPhone, calledNumber) = (calledNumber, callerPhone);
            }
        }

        if (tenant == null)
        {
            _logger.LogWarning("⚠️ No tenant found for number: {Number}", calledNumber);
            // Return TwiML that says "sorry, this number is not configured"
            return Content(
                @"<?xml version=""1.0"" encoding=""utf-8""?>
                <Response>
                    <Say>Sorry, this number is not currently in service. Goodbye.</Say>
                    <Hangup/>
                </Response>",
                "application/xml");
        }

        // Log the call
        var callLog = await _callLogs.StartCallAsync(tenant.Id, callerPhone, callSid, calledNumber);

        
        // Build the WebSocket URL for Media Streams
        var baseUrl = _config["App:BaseUrl"] ?? $"{Request.Scheme}://{Request.Host}";
        var wsUrl = baseUrl.Replace("https://", "wss://").Replace("http://", "ws://");
        
        // Use standard '&' for query parameters. The library handles XML escaping.
        var streamUrl = $"{wsUrl}/ws/media-stream?tenantId={tenant.Id}&callLogId={callLog.Id}";

        _logger.LogInformation("🔗 Starting Media Stream: {StreamUrl}", streamUrl);

        var response = new VoiceResponse();
        response.Say("Hello there. I am your voice agent. Connecting now.");
        
        var connect = new Twilio.TwiML.Voice.Connect();
        var stream = new Twilio.TwiML.Voice.Stream(url: streamUrl);
        
        // Pass parameters as <Parameter> tags too, just in case
        stream.Parameter(name: "tenant_id", value: tenant.Id.ToString());
        stream.Parameter(name: "call_log_id", value: callLog.Id.ToString());
        stream.Parameter(name: "caller_phone", value: callerPhone);
        
        connect.Append(stream);
        response.Append(connect);

        return Content(response.ToString(), "application/xml");
    }

    /// <summary>
    /// Twilio calls this when a call ends (status callback).
    /// </summary>
    [HttpPost("status")]
    public async Task<IActionResult> CallStatus()
    {
        var callSid = Request.Form["CallSid"].ToString();
        var status = Request.Form["CallStatus"].ToString();
        var duration = Request.Form["CallDuration"].ToString();

        _logger.LogInformation("📞 Call status update: {CallSid} → {Status} ({Duration}s)",
            callSid, status, duration);

        return Ok();
    }
}

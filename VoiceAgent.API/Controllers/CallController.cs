using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoiceAgent.API.Services;

namespace VoiceAgent.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CallController : ControllerBase
{
    private readonly ICallLogService _calls;

    public CallController(ICallLogService calls) { _calls = calls; }

    private int TenantId => int.Parse(User.FindFirst("tenantId")?.Value ?? "0");

    [HttpGet]
    public async Task<IActionResult> GetRecent([FromQuery] int count = 50)
    {
        var calls = await _calls.GetRecentAsync(TenantId, count);
        return Ok(calls);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var call = await _calls.GetByIdAsync(id, TenantId);
        return call != null ? Ok(call) : NotFound();
    }
}

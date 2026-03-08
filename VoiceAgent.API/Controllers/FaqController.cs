using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoiceAgent.API.Entities;
using VoiceAgent.API.Services;

namespace VoiceAgent.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FaqController : ControllerBase
{
    private readonly IFaqService _faqs;

    public FaqController(IFaqService faqs) { _faqs = faqs; }

    private int TenantId => int.Parse(User.FindFirst("tenantId")?.Value ?? "0");

    public record FaqRequest(string Question, string Answer, string? Category);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var faqs = await _faqs.GetAllAsync(TenantId);
        return Ok(faqs);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] FaqRequest req)
    {
        var faq = await _faqs.CreateAsync(TenantId, req.Question, req.Answer, req.Category);
        return Created($"/api/faq/{faq.Id}", faq);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] FaqRequest req)
    {
        var result = await _faqs.UpdateAsync(id, TenantId, req.Question, req.Answer, req.Category);
        return result ? Ok(new { message = "FAQ updated" }) : NotFound();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _faqs.DeleteAsync(id, TenantId);
        return result ? Ok(new { message = "FAQ deleted" }) : NotFound();
    }
}

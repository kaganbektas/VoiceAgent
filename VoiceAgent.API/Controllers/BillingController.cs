using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoiceAgent.API.Services;

namespace VoiceAgent.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BillingController : ControllerBase
{
    private readonly IStripeService _stripe;

    public BillingController(IStripeService stripe)
    {
        _stripe = stripe;
    }

    /// <summary>
    /// Create a Stripe Checkout session for subscription upgrade
    /// </summary>
    [Authorize]
    [HttpPost("checkout")]
    public async Task<IActionResult> CreateCheckout([FromBody] CheckoutRequest req)
    {
        var tenantId = int.Parse(User.FindFirst("tenantId")?.Value ?? "0");
        if (tenantId == 0) return Unauthorized();

        try
        {
            var url = await _stripe.CreateCheckoutSessionAsync(
                tenantId,
                req.Plan,
                req.SuccessUrl ?? "http://localhost:5173/settings?billing=success",
                req.CancelUrl ?? "http://localhost:5173/settings?billing=cancelled"
            );

            return Ok(new { url });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Create a Stripe Customer Portal session for managing subscription
    /// </summary>
    [Authorize]
    [HttpPost("portal")]
    public async Task<IActionResult> CreatePortal([FromBody] PortalRequest req)
    {
        var tenantId = int.Parse(User.FindFirst("tenantId")?.Value ?? "0");
        if (tenantId == 0) return Unauthorized();

        try
        {
            var url = await _stripe.CreateCustomerPortalSessionAsync(
                tenantId,
                req.ReturnUrl ?? "http://localhost:5173/settings"
            );

            return Ok(new { url });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Stripe webhook endpoint — receives events from Stripe
    /// </summary>
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        var signature = Request.Headers["Stripe-Signature"].FirstOrDefault() ?? "";

        try
        {
            await _stripe.HandleWebhookAsync(json, signature);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

public record CheckoutRequest(string Plan, string? SuccessUrl, string? CancelUrl);
public record PortalRequest(string? ReturnUrl);

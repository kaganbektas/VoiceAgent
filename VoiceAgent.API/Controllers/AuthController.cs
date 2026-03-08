using Microsoft.AspNetCore.Mvc;
using System.Collections.Concurrent;
using System.Text.RegularExpressions;
using VoiceAgent.API.Services;

namespace VoiceAgent.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    // Simple in-memory rate limiter: IP → (count, windowStart)
    private static readonly ConcurrentDictionary<string, (int count, DateTime window)> _rateLimits = new();
    private const int MaxAttempts = 5;
    private static readonly TimeSpan Window = TimeSpan.FromMinutes(1);

    public AuthController(IAuthService auth) { _auth = auth; }

    public record RegisterRequest(string BusinessName, string OwnerName, string Email, string Password, string? BusinessType);
    public record LoginRequest(string Email, string Password);

    private bool IsRateLimited()
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var now = DateTime.UtcNow;

        _rateLimits.AddOrUpdate(ip,
            _ => (1, now),
            (_, existing) =>
            {
                if (now - existing.window > Window)
                    return (1, now); // Reset window
                return (existing.count + 1, existing.window);
            });

        return _rateLimits.TryGetValue(ip, out var entry) && entry.count > MaxAttempts;
    }

    private static string Sanitize(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        // Strip HTML tags to prevent XSS in stored data
        return Regex.Replace(input.Trim(), "<.*?>", string.Empty);
    }

    // 🔒 Bakım modu: Sadece izinli e-postalar kayıt olabilir
    private static readonly HashSet<string> _allowedEmails = new(StringComparer.OrdinalIgnoreCase)
    {
        "alpkagambektas34@gmail.com"
    };

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (IsRateLimited())
            return StatusCode(429, new { error = "Too many requests. Please wait a moment." });

        // Bakım modu kısıtlaması
        if (!_allowedEmails.Contains(req.Email?.Trim() ?? ""))
            return StatusCode(503, new { error = "Şu an kayıt işlemleri geçici olarak kapalıdır. Lütfen daha sonra tekrar deneyiniz." });

        // Input validation
        if (string.IsNullOrWhiteSpace(req.Email) || !req.Email.Contains('@') || req.Email.Length > 200)
            return BadRequest(new { error = "Invalid email address" });
        if (string.IsNullOrWhiteSpace(req.Password) || req.Password.Length < 6 || req.Password.Length > 128)
            return BadRequest(new { error = "Password must be 6-128 characters" });
        if (string.IsNullOrWhiteSpace(req.BusinessName) || req.BusinessName.Length > 200)
            return BadRequest(new { error = "Business name is required (max 200 chars)" });
        if (string.IsNullOrWhiteSpace(req.OwnerName) || req.OwnerName.Length > 200)
            return BadRequest(new { error = "Owner name is required (max 200 chars)" });

        var (tenant, token, error) = await _auth.RegisterAsync(
            Sanitize(req.BusinessName), Sanitize(req.OwnerName),
            req.Email.Trim().ToLowerInvariant(), req.Password,
            Sanitize(req.BusinessType));

        if (error != null)
            return BadRequest(new { error });

        return Ok(new
        {
            token,
            tenant = new
            {
                tenant!.Id,
                tenant.BusinessName,
                tenant.OwnerName,
                tenant.Email,
                tenant.SubscriptionPlan,
                tenant.TrialEndsAt
            }
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (IsRateLimited())
            return StatusCode(429, new { error = "Too many attempts. Please wait a moment." });

        // Input validation
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { error = "Email and password are required" });

        var (tenant, token, error) = await _auth.LoginAsync(
            req.Email.Trim().ToLowerInvariant(), req.Password);

        if (error != null)
            return Unauthorized(new { error });

        return Ok(new
        {
            token,
            tenant = new
            {
                tenant!.Id,
                tenant.BusinessName,
                tenant.OwnerName,
                tenant.Email,
                tenant.SubscriptionPlan,
                tenant.IsActive
            }
        });
    }
}

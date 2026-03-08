using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using VoiceAgent.API.Data;
using VoiceAgent.API.Entities;

namespace VoiceAgent.API.Services;

public interface IAuthService
{
    Task<(Tenant? tenant, string? token, string? error)> RegisterAsync(string businessName, string ownerName, string email, string password, string? businessType);
    Task<(Tenant? tenant, string? token, string? error)> LoginAsync(string email, string password);
    string GenerateJwtToken(Tenant tenant);
}

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthService> _logger;

    public AuthService(AppDbContext db, IConfiguration config, ILogger<AuthService> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    public async Task<(Tenant? tenant, string? token, string? error)> RegisterAsync(
        string businessName, string ownerName, string email, string password, string? businessType)
    {
        if (await _db.Tenants.AnyAsync(t => t.Email == email))
            return (null, null, "Email already registered");

        var tenant = new Tenant
        {
            BusinessName = businessName,
            OwnerName = ownerName,
            Email = email,
            PasswordHash = HashPassword(password),
            BusinessType = businessType,
            TrialEndsAt = DateTime.UtcNow.AddDays(14)
        };

        _db.Tenants.Add(tenant);

        // Create default business hours (Mon-Fri 9-5)
        for (int i = 1; i <= 5; i++)
        {
            _db.BusinessHours.Add(new BusinessHours
            {
                Tenant = tenant,
                DayOfWeek = (DayOfWeek)i,
                OpenTime = new TimeOnly(9, 0),
                CloseTime = new TimeOnly(17, 0),
                IsClosed = false
            });
        }
        // Weekend closed
        _db.BusinessHours.Add(new BusinessHours { Tenant = tenant, DayOfWeek = DayOfWeek.Saturday, IsClosed = true });
        _db.BusinessHours.Add(new BusinessHours { Tenant = tenant, DayOfWeek = DayOfWeek.Sunday, IsClosed = true });

        await _db.SaveChangesAsync();

        var token = GenerateJwtToken(tenant);
        _logger.LogInformation("✅ New tenant registered: {Business} ({Email})", businessName, email);

        return (tenant, token, null);
    }

    public async Task<(Tenant? tenant, string? token, string? error)> LoginAsync(string email, string password)
    {
        var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Email == email);
        if (tenant == null || !VerifyPassword(password, tenant.PasswordHash))
            return (null, null, "Invalid email or password");

        if (!tenant.IsActive)
            return (null, null, "Account is deactivated");

        var token = GenerateJwtToken(tenant);
        return (tenant, token, null);
    }

    public string GenerateJwtToken(Tenant tenant)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["App:JwtSecret"]!));

        var claims = new[]
        {
            new Claim("tenantId", tenant.Id.ToString()),
            new Claim(ClaimTypes.Email, tenant.Email),
            new Claim(ClaimTypes.Name, tenant.OwnerName)
        };

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 100000, HashAlgorithmName.SHA256, 32);
        return $"{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    private static bool VerifyPassword(string password, string storedHash)
    {
        var parts = storedHash.Split('.');
        if (parts.Length != 2) return false;

        var salt = Convert.FromBase64String(parts[0]);
        var hash = Convert.FromBase64String(parts[1]);
        var computedHash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 100000, HashAlgorithmName.SHA256, 32);

        return CryptographicOperations.FixedTimeEquals(computedHash, hash);
    }
}

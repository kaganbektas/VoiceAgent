using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using VoiceAgent.API.Data;
using VoiceAgent.API.Services;
using VoiceAgent.API.Entities;

var builder = WebApplication.CreateBuilder(args);

// === Database ===
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// === JWT Authentication ===
var jwtSecret = builder.Configuration["App:JwtSecret"] ?? throw new Exception("JwtSecret not configured");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        };
    });

// === Services ===
builder.Services.AddHttpClient();
builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<ICallLogService, CallLogService>();
builder.Services.AddScoped<IFaqService, FaqService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IStripeService, StripeService>();
// ElevenLabs handles voice AI — no WebSocket handler needed

// === Controllers & CORS ===
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowDashboard", policy =>
    {
        policy.WithOrigins(
                  "http://localhost:5173",
                  "http://localhost:5174",
                  "http://localhost:5175",
                  "https://digiasistan.com",
                  "https://www.digiasistan.com"
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// === Middleware Pipeline ===
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowDashboard");

// WebSocket support removed — ElevenLabs handles media streams directly

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health check
app.MapGet("/api/health", () => Results.Ok(new
{
    status = "healthy",
    timestamp = DateTime.UtcNow
}));

// Apply pending migrations on startup (dev only)
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();

    // Find user's actual tenant by email (they registered separately)
    var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Email == "kaganbektas34@gmail.com");
    if (tenant == null)
        tenant = await db.Tenants.FindAsync(1); // fallback

    var tenantId = tenant!.Id;
    Console.WriteLine($"🔑 Active Tenant: ID={tenantId}, Email={tenant.Email}");

    if (string.IsNullOrEmpty(tenant.Description))
    {
        tenant.BusinessName = "Elit Kuaför Salonu";
        tenant.BusinessType = "Kuaför / Berber";
        tenant.Description = "İstanbul'da 15 yıllık tecrübesiyle hizmet veren profesyonel kuaför salonu. Bayan ve erkek saç kesimi, saç boyama, cilt bakımı ve manikür-pedikür hizmetleri sunuyoruz.";
        tenant.Address = "Bağdat Caddesi No:123, Kadıköy, İstanbul";
        tenant.Phone = "+905359358128";
        tenant.WebsiteUrl = "https://elitkuafor.com";
        tenant.Timezone = "Europe/Istanbul";
        tenant.Language = "tr";
        tenant.GreetingMessage = "Merhaba, Elit Kuaför Salonu'na hoş geldiniz! Size nasıl yardımcı olabilirim?";

        // Seed business hours
        var existingHours = db.BusinessHours.Where(h => h.TenantId == tenantId);
        db.BusinessHours.RemoveRange(existingHours);
        db.BusinessHours.AddRange(new[]
        {
            new BusinessHours { TenantId = tenantId, DayOfWeek = DayOfWeek.Monday,    OpenTime = new TimeOnly(9, 0), CloseTime = new TimeOnly(19, 0), IsClosed = false },
            new BusinessHours { TenantId = tenantId, DayOfWeek = DayOfWeek.Tuesday,   OpenTime = new TimeOnly(9, 0), CloseTime = new TimeOnly(19, 0), IsClosed = false },
            new BusinessHours { TenantId = tenantId, DayOfWeek = DayOfWeek.Wednesday, OpenTime = new TimeOnly(9, 0), CloseTime = new TimeOnly(19, 0), IsClosed = false },
            new BusinessHours { TenantId = tenantId, DayOfWeek = DayOfWeek.Thursday,  OpenTime = new TimeOnly(9, 0), CloseTime = new TimeOnly(19, 0), IsClosed = false },
            new BusinessHours { TenantId = tenantId, DayOfWeek = DayOfWeek.Friday,    OpenTime = new TimeOnly(9, 0), CloseTime = new TimeOnly(19, 0), IsClosed = false },
            new BusinessHours { TenantId = tenantId, DayOfWeek = DayOfWeek.Saturday,  OpenTime = new TimeOnly(9, 0), CloseTime = new TimeOnly(18, 0), IsClosed = false },
            new BusinessHours { TenantId = tenantId, DayOfWeek = DayOfWeek.Sunday,    OpenTime = new TimeOnly(0, 0), CloseTime = new TimeOnly(0, 0), IsClosed = true },
        });

        // Seed services
        var existingServices = db.ServiceTypes.Where(s => s.TenantId == tenantId);
        db.ServiceTypes.RemoveRange(existingServices);
        db.ServiceTypes.AddRange(new[]
        {
            new ServiceType { TenantId = tenantId, Name = "Erkek Saç Kesimi",  Duration = 30, Price = 250, IsActive = true },
            new ServiceType { TenantId = tenantId, Name = "Bayan Saç Kesimi",  Duration = 45, Price = 400, IsActive = true },
            new ServiceType { TenantId = tenantId, Name = "Saç Boyama",        Duration = 90, Price = 800, IsActive = true },
            new ServiceType { TenantId = tenantId, Name = "Sakal Tıraşı",      Duration = 20, Price = 150, IsActive = true },
            new ServiceType { TenantId = tenantId, Name = "Cilt Bakımı",       Duration = 60, Price = 500, IsActive = true },
            new ServiceType { TenantId = tenantId, Name = "Manikür",           Duration = 30, Price = 200, IsActive = true },
            new ServiceType { TenantId = tenantId, Name = "Fön",               Duration = 30, Price = 200, IsActive = true },
        });

        // Seed FAQs
        var existingFaqs = db.Faqs.Where(f => f.TenantId == tenantId);
        db.Faqs.RemoveRange(existingFaqs);
        db.Faqs.AddRange(new[]
        {
            new Faq { TenantId = tenantId, Question = "Randevu almadan gelebilir miyim?", Answer = "Randevusuz da gelebilirsiniz ancak randevulu müşterilerimize öncelik veriyoruz. Yoğun saatlerde bekleme süresi olabilir.", Category = "genel", IsActive = true },
            new Faq { TenantId = tenantId, Question = "Ödeme yöntemleriniz nelerdir?", Answer = "Nakit, kredi kartı ve banka kartı ile ödeme kabul ediyoruz.", Category = "ödeme", IsActive = true },
            new Faq { TenantId = tenantId, Question = "Park yeri var mı?", Answer = "Evet, binamızın altında ücretsiz otopark mevcuttur.", Category = "konum", IsActive = true },
            new Faq { TenantId = tenantId, Question = "İptal ve değişiklik politikanız nedir?", Answer = "Randevunuzu en az 2 saat öncesinden iptal veya değiştirmenizi rica ederiz.", Category = "genel", IsActive = true },
        });

        await db.SaveChangesAsync();
        Console.WriteLine($"✅ Seed data inserted for Tenant {tenantId} (Elit Kuaför Salonu)");
    }

    // Move any Tenant 1 data to user's tenant if different
    if (tenantId != 1)
    {
        var orphanedAppointments = await db.Appointments.Where(a => a.TenantId == 1).ToListAsync();
        foreach (var appt in orphanedAppointments)
            appt.TenantId = tenantId;

        var orphanedCustomers = await db.Customers.Where(c => c.TenantId == 1).ToListAsync();
        foreach (var cust in orphanedCustomers)
            cust.TenantId = tenantId;

        if (orphanedAppointments.Any() || orphanedCustomers.Any())
        {
            await db.SaveChangesAsync();
            if (orphanedAppointments.Any())
                Console.WriteLine($"📦 Moved {orphanedAppointments.Count} appointments from Tenant 1 → Tenant {tenantId}");
            if (orphanedCustomers.Any())
                Console.WriteLine($"👥 Moved {orphanedCustomers.Count} customers from Tenant 1 → Tenant {tenantId}");
        }
    }
}

app.Run();

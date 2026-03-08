using Stripe;
using Stripe.Checkout;
using VoiceAgent.API.Data;
using Microsoft.EntityFrameworkCore;

namespace VoiceAgent.API.Services;

public interface IStripeService
{
    Task<string> CreateCheckoutSessionAsync(int tenantId, string plan, string successUrl, string cancelUrl);
    Task<string> CreateCustomerPortalSessionAsync(int tenantId, string returnUrl);
    Task HandleWebhookAsync(string json, string signature);
}

public class StripeService : IStripeService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<StripeService> _logger;

    // Plan → Stripe Price ID mapping (set these in appsettings.json)
    private Dictionary<string, string> PriceIds => new()
    {
        ["starter"] = _config["Stripe:StarterPriceId"] ?? "",
        ["professional"] = _config["Stripe:ProfessionalPriceId"] ?? "",
        ["enterprise"] = _config["Stripe:EnterprisePriceId"] ?? ""
    };

    private Dictionary<string, (int minutes, int sms)> PlanLimits => new()
    {
        ["trial"] = (50, 20),
        ["starter"] = (300, 100),
        ["professional"] = (1000, 500),
        ["enterprise"] = (3000, 9999)
    };

    public StripeService(AppDbContext db, IConfiguration config, ILogger<StripeService> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
        StripeConfiguration.ApiKey = _config["Stripe:SecretKey"];
    }

    public async Task<string> CreateCheckoutSessionAsync(int tenantId, string plan, string successUrl, string cancelUrl)
    {
        var tenant = await _db.Tenants.FindAsync(tenantId);
        if (tenant == null) throw new Exception("Tenant not found");

        // Create or get Stripe customer
        if (string.IsNullOrEmpty(tenant.StripeCustomerId))
        {
            var customerService = new Stripe.CustomerService();
            var customer = await customerService.CreateAsync(new Stripe.CustomerCreateOptions
            {
                Email = tenant.Email,
                Name = tenant.BusinessName,
                Metadata = new Dictionary<string, string> { ["tenantId"] = tenantId.ToString() }
            });
            tenant.StripeCustomerId = customer.Id;
            await _db.SaveChangesAsync();
        }

        if (!PriceIds.TryGetValue(plan, out var priceId) || string.IsNullOrEmpty(priceId))
            throw new Exception($"Invalid plan: {plan}");

        var sessionService = new SessionService();
        var session = await sessionService.CreateAsync(new SessionCreateOptions
        {
            Customer = tenant.StripeCustomerId,
            Mode = "subscription",
            LineItems = new List<SessionLineItemOptions>
            {
                new() { Price = priceId, Quantity = 1 }
            },
            SuccessUrl = successUrl + "?session_id={CHECKOUT_SESSION_ID}",
            CancelUrl = cancelUrl,
            Metadata = new Dictionary<string, string>
            {
                ["tenantId"] = tenantId.ToString(),
                ["plan"] = plan
            }
        });

        return session.Url;
    }

    public async Task<string> CreateCustomerPortalSessionAsync(int tenantId, string returnUrl)
    {
        var tenant = await _db.Tenants.FindAsync(tenantId);
        if (tenant == null || string.IsNullOrEmpty(tenant.StripeCustomerId))
            throw new Exception("No Stripe customer found. Please subscribe first.");

        var portalService = new Stripe.BillingPortal.SessionService();
        var session = await portalService.CreateAsync(new Stripe.BillingPortal.SessionCreateOptions
        {
            Customer = tenant.StripeCustomerId,
            ReturnUrl = returnUrl
        });

        return session.Url;
    }

    public async Task HandleWebhookAsync(string json, string signature)
    {
        var webhookSecret = _config["Stripe:WebhookSecret"] ?? "";
        
        Event stripeEvent;
        try
        {
            stripeEvent = EventUtility.ConstructEvent(json, signature, webhookSecret);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe webhook signature verification failed");
            throw;
        }

        _logger.LogInformation("Stripe webhook: {Type}", stripeEvent.Type);

        switch (stripeEvent.Type)
        {
            case "checkout.session.completed":
                await HandleCheckoutCompleted(stripeEvent);
                break;
            case "customer.subscription.updated":
                await HandleSubscriptionUpdated(stripeEvent);
                break;
            case "customer.subscription.deleted":
                await HandleSubscriptionDeleted(stripeEvent);
                break;
            case "invoice.payment_succeeded":
                _logger.LogInformation("Payment succeeded");
                break;
            case "invoice.payment_failed":
                await HandlePaymentFailed(stripeEvent);
                break;
        }
    }

    private async Task HandleCheckoutCompleted(Event e)
    {
        var session = e.Data.Object as Session;
        if (session?.Metadata == null) return;

        if (session.Metadata.TryGetValue("tenantId", out var tenantIdStr) &&
            int.TryParse(tenantIdStr, out var tenantId))
        {
            var tenant = await _db.Tenants.FindAsync(tenantId);
            if (tenant == null) return;

            session.Metadata.TryGetValue("plan", out var plan);

            tenant.StripeSubscriptionId = session.SubscriptionId;
            tenant.SubscriptionPlan = plan ?? "starter";
            tenant.SubscriptionStatus = "active";
            tenant.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            _logger.LogInformation("Tenant {Id} upgraded to {Plan}", tenantId, plan);
        }
    }

    private async Task HandleSubscriptionUpdated(Event e)
    {
        var subscription = e.Data.Object as Subscription;
        if (subscription == null) return;

        var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.StripeCustomerId == subscription.CustomerId);
        if (tenant == null) return;

        tenant.SubscriptionStatus = subscription.Status;

        // Detect plan change by price ID
        var priceId = subscription.Items?.Data?.FirstOrDefault()?.Price?.Id;
        if (priceId != null)
        {
            foreach (var (plan, pid) in PriceIds)
            {
                if (pid == priceId) { tenant.SubscriptionPlan = plan; break; }
            }
        }

        tenant.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    private async Task HandleSubscriptionDeleted(Event e)
    {
        var subscription = e.Data.Object as Subscription;
        if (subscription == null) return;

        var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.StripeCustomerId == subscription.CustomerId);
        if (tenant == null) return;

        tenant.SubscriptionPlan = "trial";
        tenant.SubscriptionStatus = "cancelled";
        tenant.StripeSubscriptionId = null;
        tenant.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        _logger.LogInformation("Tenant {Id} subscription cancelled", tenant.Id);
    }

    private async Task HandlePaymentFailed(Event e)
    {
        var invoice = e.Data.Object as Invoice;
        if (invoice == null) return;

        var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.StripeCustomerId == invoice.CustomerId);
        if (tenant == null) return;

        tenant.SubscriptionStatus = "past_due";
        tenant.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogWarning("Payment failed for tenant {Id}", tenant.Id);
    }

    public (int minutes, int sms) GetPlanLimits(string plan)
    {
        return PlanLimits.TryGetValue(plan, out var limits) ? limits : (50, 20);
    }
}

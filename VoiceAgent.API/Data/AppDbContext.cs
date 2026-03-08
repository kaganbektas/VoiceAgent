using Microsoft.EntityFrameworkCore;
using VoiceAgent.API.Entities;

namespace VoiceAgent.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Tenant> Tenants { get; set; }
    public DbSet<Appointment> Appointments { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<CallLog> CallLogs { get; set; }
    public DbSet<BusinessHours> BusinessHours { get; set; }
    public DbSet<Faq> Faqs { get; set; }
    public DbSet<ServiceType> ServiceTypes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Tenant
        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.TwilioPhoneNumber).IsUnique().HasFilter("\"TwilioPhoneNumber\" IS NOT NULL");
            entity.Property(e => e.BusinessName).HasMaxLength(200);
            entity.Property(e => e.OwnerName).HasMaxLength(200);
            entity.Property(e => e.Email).HasMaxLength(200);
            entity.Property(e => e.SubscriptionPlan).HasMaxLength(20);
            entity.Property(e => e.SubscriptionStatus).HasMaxLength(20);
        });

        // Appointment
        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.HasIndex(e => new { e.TenantId, e.Date, e.StartTime });
            entity.HasOne(e => e.Tenant).WithMany(t => t.Appointments).HasForeignKey(e => e.TenantId);
            entity.HasOne(e => e.CallLog).WithMany(c => c.Appointments).HasForeignKey(e => e.CallLogId);
            entity.Property(e => e.CustomerName).HasMaxLength(200);
            entity.Property(e => e.BookedVia).HasMaxLength(20);
        });

        // Customer
        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasIndex(e => new { e.TenantId, e.Phone }).IsUnique();
            entity.HasOne(e => e.Tenant).WithMany(t => t.Customers).HasForeignKey(e => e.TenantId);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Phone).HasMaxLength(20);
        });

        // CallLog
        modelBuilder.Entity<CallLog>(entity =>
        {
            entity.HasIndex(e => new { e.TenantId, e.StartedAt });
            entity.HasOne(e => e.Tenant).WithMany(t => t.CallLogs).HasForeignKey(e => e.TenantId);
            entity.Property(e => e.TwilioCallSid).HasMaxLength(100);
            entity.Property(e => e.CallerPhone).HasMaxLength(20);
            entity.Property(e => e.Direction).HasMaxLength(10);
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.CostUsd).HasPrecision(8, 4);
        });

        // BusinessHours
        modelBuilder.Entity<BusinessHours>(entity =>
        {
            entity.HasIndex(e => new { e.TenantId, e.DayOfWeek }).IsUnique();
            entity.HasOne(e => e.Tenant).WithMany(t => t.BusinessHoursList).HasForeignKey(e => e.TenantId);
        });

        // Faq
        modelBuilder.Entity<Faq>(entity =>
        {
            entity.HasOne(e => e.Tenant).WithMany(t => t.Faqs).HasForeignKey(e => e.TenantId);
            entity.Property(e => e.Category).HasMaxLength(50);
        });

        // ServiceType
        modelBuilder.Entity<ServiceType>(entity =>
        {
            entity.HasOne(e => e.Tenant).WithMany(t => t.ServiceTypes).HasForeignKey(e => e.TenantId);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.Price).HasPrecision(10, 2);
        });
    }
}

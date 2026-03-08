using Microsoft.EntityFrameworkCore;
using VoiceAgent.API.Data;
using VoiceAgent.API.Entities;

namespace VoiceAgent.API.Services;

public interface ICustomerService
{
    Task<List<Customer>> GetAllAsync(int tenantId);
    Task<Customer?> GetByPhoneAsync(int tenantId, string phone);
    Task<Customer> CreateOrUpdateAsync(int tenantId, string name, string phone, string? email = null);
    Task<Customer?> UpdateAsync(int id, int tenantId, string name, string? phone, string? email);
    Task<bool> DeleteAsync(int id, int tenantId);
}

public class CustomerService : ICustomerService
{
    private readonly AppDbContext _db;

    public CustomerService(AppDbContext db) { _db = db; }

    public async Task<List<Customer>> GetAllAsync(int tenantId) =>
        await _db.Customers.Where(c => c.TenantId == tenantId).OrderBy(c => c.Name).ToListAsync();

    public async Task<Customer?> GetByPhoneAsync(int tenantId, string phone) =>
        await _db.Customers.FirstOrDefaultAsync(c => c.TenantId == tenantId && c.Phone == phone);

    public async Task<Customer> CreateOrUpdateAsync(int tenantId, string name, string phone, string? email = null)
    {
        var existing = await _db.Customers
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.Phone == phone);

        if (existing != null)
        {
            existing.Name = name;
            if (email != null) existing.Email = email;
        }
        else
        {
            existing = new Customer
            {
                TenantId = tenantId, Name = name, Phone = phone, Email = email
            };
            _db.Customers.Add(existing);
        }

        await _db.SaveChangesAsync();
        return existing;
    }

    public async Task<Customer?> UpdateAsync(int id, int tenantId, string name, string? phone, string? email)
    {
        var customer = await _db.Customers
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);
        if (customer == null) return null;

        customer.Name = name;
        if (phone != null) customer.Phone = phone;
        if (email != null) customer.Email = email;

        await _db.SaveChangesAsync();
        return customer;
    }

    public async Task<bool> DeleteAsync(int id, int tenantId)
    {
        var customer = await _db.Customers
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);
        if (customer == null) return false;

        _db.Customers.Remove(customer);
        await _db.SaveChangesAsync();
        return true;
    }
}

using Microsoft.EntityFrameworkCore;
using VoiceAgent.API.Data;
using VoiceAgent.API.Entities;

namespace VoiceAgent.API.Services;

public interface IFaqService
{
    Task<List<Faq>> GetAllAsync(int tenantId);
    Task<string> GetFaqsAsTextAsync(int tenantId);
    Task<Faq> CreateAsync(int tenantId, string question, string answer, string? category);
    Task<bool> UpdateAsync(int id, int tenantId, string question, string answer, string? category);
    Task<bool> DeleteAsync(int id, int tenantId);
}

public class FaqService : IFaqService
{
    private readonly AppDbContext _db;

    public FaqService(AppDbContext db) { _db = db; }

    public async Task<List<Faq>> GetAllAsync(int tenantId) =>
        await _db.Faqs.Where(f => f.TenantId == tenantId && f.IsActive).ToListAsync();

    public async Task<string> GetFaqsAsTextAsync(int tenantId)
    {
        var faqs = await GetAllAsync(tenantId);
        if (!faqs.Any()) return "No FAQs configured yet.";

        return string.Join("\n", faqs.Select(f => $"Q: {f.Question}\nA: {f.Answer}"));
    }

    public async Task<Faq> CreateAsync(int tenantId, string question, string answer, string? category)
    {
        var faq = new Faq { TenantId = tenantId, Question = question, Answer = answer, Category = category };
        _db.Faqs.Add(faq);
        await _db.SaveChangesAsync();
        return faq;
    }

    public async Task<bool> UpdateAsync(int id, int tenantId, string question, string answer, string? category)
    {
        var faq = await _db.Faqs.FirstOrDefaultAsync(f => f.Id == id && f.TenantId == tenantId);
        if (faq == null) return false;

        faq.Question = question;
        faq.Answer = answer;
        faq.Category = category;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id, int tenantId)
    {
        var faq = await _db.Faqs.FirstOrDefaultAsync(f => f.Id == id && f.TenantId == tenantId);
        if (faq == null) return false;

        _db.Faqs.Remove(faq);
        await _db.SaveChangesAsync();
        return true;
    }
}

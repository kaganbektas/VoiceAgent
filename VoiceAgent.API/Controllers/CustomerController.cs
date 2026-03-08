using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoiceAgent.API.Services;

namespace VoiceAgent.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomerController : ControllerBase
{
    private readonly ICustomerService _customers;

    public CustomerController(ICustomerService customers) { _customers = customers; }

    private int TenantId => int.Parse(User.FindFirst("tenantId")?.Value ?? "0");

    public record CreateCustomerRequest(string Name, string Phone, string? Email);
    public record UpdateCustomerRequest(string Name, string? Phone, string? Email);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var customers = await _customers.GetAllAsync(TenantId);
        return Ok(customers);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCustomerRequest req)
    {
        var customer = await _customers.CreateOrUpdateAsync(TenantId, req.Name, req.Phone, req.Email);
        return Ok(customer);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCustomerRequest req)
    {
        var customer = await _customers.UpdateAsync(id, TenantId, req.Name, req.Phone, req.Email);
        return customer != null ? Ok(customer) : NotFound();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _customers.DeleteAsync(id, TenantId);
        return result ? Ok(new { message = "Customer deleted" }) : NotFound();
    }
}

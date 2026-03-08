using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using VoiceAgent.API.Services;

namespace VoiceAgent.API.Controllers;

/// <summary>
/// ElevenLabs Conversational AI Server Tools webhook controller.
/// ElevenLabs calls these endpoints when the AI agent invokes a tool during conversation.
/// NOT behind JWT auth — ElevenLabs calls these directly.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ElevenLabsController : ControllerBase
{
    private readonly IAppointmentService _appointments;
    private readonly ITenantService _tenants;
    private readonly IFaqService _faqs;
    private readonly ICallLogService _callLogs;
    private readonly INotificationService _notifications;
    private readonly ICustomerService _customers;
    private readonly ILogger<ElevenLabsController> _logger;

    public ElevenLabsController(
        IAppointmentService appointments,
        ITenantService tenants,
        IFaqService faqs,
        ICallLogService callLogs,
        INotificationService notifications,
        ICustomerService customers,
        ILogger<ElevenLabsController> logger)
    {
        _appointments = appointments;
        _tenants = tenants;
        _faqs = faqs;
        _callLogs = callLogs;
        _notifications = notifications;
        _customers = customers;
        _logger = logger;
    }

    /// <summary>
    /// Check available appointment slots for a specific date.
    /// ElevenLabs Server Tool: check_availability
    /// </summary>
    private static readonly string[] TurkishDayNames =
        { "Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi" };

    private static readonly string[] TurkishMonthNames =
        { "", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
          "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık" };

    private static string FormatDateTurkish(DateOnly date)
    {
        var dayName = TurkishDayNames[(int)date.DayOfWeek];
        return $"{dayName}, {date.Day} {TurkishMonthNames[date.Month]}";
    }

    [HttpPost("check-availability")]
    public async Task<IActionResult> CheckAvailability([FromBody] JsonElement body)
    {
        try
        {
            var tenantId = GetIntProperty(body, "tenant_id");
            var dateStr = GetStringProperty(body, "date");

            _logger.LogInformation("🔍 ElevenLabs tool: check_availability (Tenant: {TenantId}, Date: {Date})",
                tenantId, dateStr);

            if (tenantId == 0)
                return Ok(new { result = "Tenant bilgisi eksik. Lütfen tekrar deneyin." });

            // If no specific date, show weekly overview
            if (string.IsNullOrEmpty(dateStr) || !DateOnly.TryParse(dateStr, out var date))
            {
                return Ok(new { result = await GetWeeklyOverview(tenantId) });
            }

            var slots = await _appointments.GetAvailableSlotsAsync(tenantId, date);
            var formattedDate = FormatDateTurkish(date);

            if (!slots.Any())
                return Ok(new { result = $"{formattedDate} tarihinde müsait randevu yok. Başka bir gün denemek ister misiniz?" });

            var slotList = string.Join(", ", slots.Take(8).Select(s => s.ToString("HH:mm")));
            return Ok(new { result = $"{formattedDate} tarihinde müsait saatler: {slotList}. Hangi saat size uygun?" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ check_availability error");
            return Ok(new { result = "Müsaitlik kontrol edilirken bir hata oluştu. Lütfen tekrar deneyin." });
        }
    }

    private async Task<string> GetWeeklyOverview(int tenantId)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(3)); // Turkey UTC+3
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("Bu haftaki müsaitlik durumu:");

        for (int i = 0; i < 7; i++)
        {
            var checkDate = today.AddDays(i);
            var slots = await _appointments.GetAvailableSlotsAsync(tenantId, checkDate);
            var formattedDate = FormatDateTurkish(checkDate);

            if (!slots.Any())
                sb.AppendLine($"  {formattedDate}: Dolu / Kapalı");
            else
                sb.AppendLine($"  {formattedDate}: {slots.Count} müsait saat var");
        }

        sb.AppendLine("Hangi gün için detaylı bakmamı istersiniz?");
        return sb.ToString();
    }

    /// <summary>
    /// Book an appointment for the caller.
    /// ElevenLabs Server Tool: book_appointment
    /// </summary>
    [HttpPost("book-appointment")]
    public async Task<IActionResult> BookAppointment([FromBody] JsonElement body)
    {
        try
        {
            var tenantId = GetIntProperty(body, "tenant_id");
            var customerName = GetStringProperty(body, "customer_name");
            var customerPhone = GetStringProperty(body, "customer_phone");
            // Fall back to caller_phone (Twilio caller ID) when AI doesn't have explicit phone from customer
            if (string.IsNullOrEmpty(customerPhone))
                customerPhone = GetStringProperty(body, "caller_phone");
            var dateStr = GetStringProperty(body, "date");
            var timeStr = GetStringProperty(body, "time");
            var serviceType = GetStringProperty(body, "service_type");
            var notes = GetStringProperty(body, "notes");

            _logger.LogInformation("📅 ElevenLabs tool: book_appointment (Tenant: {TenantId}, Customer: {Customer}, Date: {Date}, Time: {Time})",
                tenantId, customerName, dateStr, timeStr);

            if (tenantId == 0)
                return Ok(new { result = "Tenant bilgisi eksik." });

            if (string.IsNullOrEmpty(customerName) || !DateOnly.TryParse(dateStr, out var date) || !TimeOnly.TryParse(timeStr, out var time))
                return Ok(new { result = "Randevu almak için müşteri adı, tarih ve saat bilgisi gerekiyor." });

            // Check for conflicts first
            var (hasConflict, conflictMsg) = await _appointments.CheckConflictAsync(tenantId, date, time);
            if (hasConflict)
                return Ok(new { result = $"Bu saat dolu. {conflictMsg}. Başka bir saat ister misiniz?" });

            var appointment = await _appointments.BookAppointmentAsync(
                tenantId, customerName, customerPhone,
                date, time, serviceType, notes);

            // Send SMS confirmation in background (truly fire-and-forget)
            if (!string.IsNullOrEmpty(customerPhone))
            {
                var capturedTenantId = tenantId;
                var capturedPhone = customerPhone;
                var capturedName = customerName;
                var capturedDate = date;
                var capturedTime = time;
                Task.Run(async () =>
                {
                    try
                    {
                        var tenant = await _tenants.GetByIdAsync(capturedTenantId);
                        await _notifications.SendAppointmentConfirmationAsync(
                            capturedPhone,
                            capturedName,
                            capturedDate.ToString("d MMMM yyyy"),
                            capturedTime.ToString("HH:mm"),
                            tenant?.BusinessName ?? "");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "⚠️ SMS gönderilemedi: {Phone}", capturedPhone);
                    }
                });
            }

            return Ok(new { result = $"{customerName} için {date:dddd, d MMMM} saat {time:HH:mm}'de randevu onaylandı. Kısa süre içinde SMS ile onay gönderilecek." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ book_appointment error");
            return Ok(new { result = "Randevu oluşturulurken bir hata oluştu. Lütfen tekrar deneyin." });
        }
    }

    /// <summary>
    /// Get business information (hours, location, services, pricing).
    /// ElevenLabs Server Tool: get_business_info
    /// </summary>
    [HttpPost("get-business-info")]
    public async Task<IActionResult> GetBusinessInfo([FromBody] JsonElement body)
    {
        try
        {
            var tenantId = GetIntProperty(body, "tenant_id");
            var infoType = GetStringProperty(body, "info_type") ?? "all";

            _logger.LogInformation("ℹ️ ElevenLabs tool: get_business_info (Tenant: {TenantId}, Type: {InfoType})",
                tenantId, infoType);

            if (tenantId == 0)
                return Ok(new { result = "Tenant bilgisi eksik." });

            var info = await _tenants.GetBusinessInfoTextAsync(tenantId, infoType);
            return Ok(new { result = info });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ get_business_info error");
            return Ok(new { result = "İş yeri bilgisi alınırken bir hata oluştu." });
        }
    }

    /// <summary>
    /// Cancel an appointment by customer name.
    /// ElevenLabs Server Tool: cancel_appointment
    /// </summary>
    [HttpPost("cancel-appointment")]
    public async Task<IActionResult> CancelAppointment([FromBody] JsonElement body)
    {
        try
        {
            var tenantId = GetIntProperty(body, "tenant_id");
            var customerName = GetStringProperty(body, "customer_name");
            var dateStr = GetStringProperty(body, "date");

            _logger.LogInformation("❌ ElevenLabs tool: cancel_appointment (Tenant: {TenantId}, Customer: {Customer}, Date: {Date})",
                tenantId, customerName, dateStr);

            if (tenantId == 0)
                return Ok(new { result = "Tenant bilgisi eksik." });

            if (string.IsNullOrEmpty(customerName))
                return Ok(new { result = "Randevu iptal etmek için müşteri adı gerekiyor." });

            DateOnly? date = null;
            if (!string.IsNullOrEmpty(dateStr) && DateOnly.TryParse(dateStr, out var parsedDate))
                date = parsedDate;

            var appointment = await _appointments.FindByCustomerAsync(tenantId, customerName, date);

            if (appointment == null)
                return Ok(new { result = $"{customerName} adına yaklaşan bir randevu bulunamadı. Adı veya tarihi kontrol edebilir misiniz?" });

            var aptDate = FormatDateTurkish(appointment.Date);
            var aptTime = appointment.StartTime.ToString("HH:mm");
            var cancelled = await _appointments.CancelAsync(appointment.Id, tenantId);

            if (cancelled)
                return Ok(new { result = $"{customerName} adına {aptDate} saat {aptTime}'deki randevu iptal edildi." });
            else
                return Ok(new { result = "Randevu iptal edilirken bir sorun oluştu. Lütfen tekrar deneyin." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ cancel_appointment error");
            return Ok(new { result = "Randevu iptal edilirken bir hata oluştu. Lütfen tekrar deneyin." });
        }
    }

    /// <summary>
    /// Reschedule an appointment to a new date/time.
    /// ElevenLabs Server Tool: reschedule_appointment
    /// </summary>
    [HttpPost("reschedule-appointment")]
    public async Task<IActionResult> RescheduleAppointment([FromBody] JsonElement body)
    {
        try
        {
            var tenantId = GetIntProperty(body, "tenant_id");
            var customerName = GetStringProperty(body, "customer_name");
            var currentDateStr = GetStringProperty(body, "current_date");
            var newDateStr = GetStringProperty(body, "new_date");
            var newTimeStr = GetStringProperty(body, "new_time");

            _logger.LogInformation("🔄 ElevenLabs tool: reschedule_appointment (Tenant: {TenantId}, Customer: {Customer})",
                tenantId, customerName);

            if (tenantId == 0)
                return Ok(new { result = "Tenant bilgisi eksik." });

            if (string.IsNullOrEmpty(customerName))
                return Ok(new { result = "Randevu değiştirmek için müşteri adı gerekiyor." });

            if (!DateOnly.TryParse(newDateStr, out var newDate) || !TimeOnly.TryParse(newTimeStr, out var newTime))
                return Ok(new { result = "Yeni tarih ve saat bilgisi gerekiyor." });

            DateOnly? currentDate = null;
            if (!string.IsNullOrEmpty(currentDateStr) && DateOnly.TryParse(currentDateStr, out var parsedCurrentDate))
                currentDate = parsedCurrentDate;

            var appointment = await _appointments.FindByCustomerAsync(tenantId, customerName, currentDate);

            if (appointment == null)
                return Ok(new { result = $"{customerName} adına yaklaşan bir randevu bulunamadı. Adı veya tarihi kontrol edebilir misiniz?" });

            // Check for conflicts at the new time
            var (hasConflict, _) = await _appointments.CheckConflictAsync(tenantId, newDate, newTime);
            if (hasConflict)
                return Ok(new { result = $"{FormatDateTurkish(newDate)} saat {newTime:HH:mm} dolu. Başka bir saat önerebilir misiniz?" });

            var rescheduled = await _appointments.RescheduleAsync(tenantId, appointment.Id, newDate, newTime);

            if (rescheduled != null)
                return Ok(new { result = $"{customerName} adına randevu {FormatDateTurkish(newDate)} saat {newTime:HH:mm} olarak güncellendi." });
            else
                return Ok(new { result = "Randevu güncellenirken bir sorun oluştu. Lütfen tekrar deneyin." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ reschedule_appointment error");
            return Ok(new { result = "Randevu değiştirilirken bir hata oluştu. Lütfen tekrar deneyin." });
        }
    }

    /// <summary>
    /// Save caller's name linked to their Twilio caller ID phone number.
    /// Call this as soon as the caller introduces themselves by name.
    /// ElevenLabs Server Tool: save_caller_name
    /// </summary>
    [HttpPost("save-caller-name")]
    public async Task<IActionResult> SaveCallerName([FromBody] JsonElement body)
    {
        try
        {
            var tenantId = GetIntProperty(body, "tenant_id");
            var callerName = GetStringProperty(body, "caller_name");
            var callerPhone = GetStringProperty(body, "caller_phone");

            _logger.LogInformation("👤 ElevenLabs tool: save_caller_name (Tenant: {TenantId}, Name: {Name}, Phone: {Phone})",
                tenantId, callerName, callerPhone);

            if (tenantId == 0 || string.IsNullOrEmpty(callerName) || string.IsNullOrEmpty(callerPhone))
                return Ok(new { result = "ok" });

            await _customers.CreateOrUpdateAsync(tenantId, callerName, callerPhone);

            return Ok(new { result = "ok" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ save_caller_name error");
            return Ok(new { result = "ok" });
        }
    }

    /// <summary>
    /// Transfer the call to a human staff member.
    /// ElevenLabs Server Tool: transfer_to_human
    /// </summary>
    [HttpPost("transfer-to-human")]
    public IActionResult TransferToHuman([FromBody] JsonElement body)
    {
        try
        {
            var reason = GetStringProperty(body, "reason") ?? "genel talep";
            var tenantId = GetIntProperty(body, "tenant_id");

            _logger.LogInformation("🔄 ElevenLabs tool: transfer_to_human (Tenant: {TenantId}, Reason: {Reason})",
                tenantId, reason);

            return Ok(new { result = $"Aktarım talebi alındı: {reason}. Lütfen arayanı en kısa sürede geri aranacağı konusunda bilgilendirin." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ transfer_to_human error");
            return Ok(new { result = "Aktarım sırasında bir hata oluştu." });
        }
    }

    /// <summary>
    /// ElevenLabs post-call webhook — receives call data after the call ends.
    /// Can be used for logging transcripts, analytics, etc.
    /// </summary>
    [HttpPost("post-call")]
    public async Task<IActionResult> PostCallWebhook([FromBody] JsonElement body)
    {
        try
        {
            _logger.LogInformation("📞 ElevenLabs post-call webhook received");

            // ElevenLabs standart formatı:
            //   { type, data: { conversation_id, transcript:[{role,message}], analysis:{transcript_summary, call_successful},
            //                   conversation_initiation_client_data: { custom_llm_extra_body: { metadata: {caller_phone, tenant_id} } },
            //                   custom_variables: { caller_phone, tenant_id, caller_name } } }
            // Twilio flat formatı da desteklenir: { conversation_id, caller_phone, tenant_id, caller_name, ... }
            var data = body.TryGetProperty("data", out var dataEl) ? dataEl : body;

            var conversationId = GetStringProperty(data, "conversation_id") ?? GetStringProperty(body, "conversation_id");

            // custom_variables: ElevenLabs'ın özel değişken geçirme yolu
            // Olası yerler: data.custom_variables, data.conversation_initiation_client_data.custom_llm_extra_body.metadata
            JsonElement? customVars = null;
            if (data.TryGetProperty("custom_variables", out var cvEl))
                customVars = cvEl;
            else if (data.TryGetProperty("conversation_initiation_client_data", out var cicd)
                && cicd.TryGetProperty("custom_llm_extra_body", out var extraBody)
                && extraBody.TryGetProperty("metadata", out var metaEl))
                customVars = metaEl;

            // tenant_id ve caller_phone: custom_variables öncelikli, yoksa data/body flat
            var tenantId = (customVars.HasValue ? GetIntProperty(customVars.Value, "tenant_id") : 0);
            if (tenantId == 0) tenantId = GetIntProperty(data, "tenant_id") > 0 ? GetIntProperty(data, "tenant_id") : GetIntProperty(body, "tenant_id");

            var callerPhone = (customVars.HasValue ? GetStringProperty(customVars.Value, "caller_phone") : null)
                ?? GetStringProperty(data, "caller_phone") ?? GetStringProperty(body, "caller_phone");

            var callerName = (customVars.HasValue ? GetStringProperty(customVars.Value, "caller_name") : null)
                ?? GetStringProperty(data, "caller_name") ?? GetStringProperty(body, "caller_name");

            // Özet: data.analysis.transcript_summary (ElevenLabs standart), yoksa flat summary
            string? summary = null;
            string? sentiment = null;
            if (data.TryGetProperty("analysis", out var analysisEl))
            {
                summary = GetStringProperty(analysisEl, "transcript_summary");
                sentiment = GetStringProperty(analysisEl, "call_successful"); // "success" | "failure" | "unknown"
            }
            if (string.IsNullOrEmpty(summary))
                summary = GetStringProperty(data, "summary") ?? GetStringProperty(body, "summary");

            // Transkript: ElevenLabs'ta [{role, message}] array, flat'ta string
            string? transcript = null;
            if (data.TryGetProperty("transcript", out var transcriptEl) && transcriptEl.ValueKind == JsonValueKind.Array)
            {
                var lines = new System.Text.StringBuilder();
                foreach (var line in transcriptEl.EnumerateArray())
                {
                    var role = GetStringProperty(line, "role") ?? "?";
                    var message = GetStringProperty(line, "message") ?? "";
                    lines.AppendLine($"{(role == "agent" ? "AI" : "Müşteri")}: {message}");
                }
                transcript = lines.ToString();
            }
            else
            {
                transcript = GetStringProperty(data, "transcript") ?? GetStringProperty(body, "transcript");
            }

            _logger.LogInformation("📞 Post-call parsed: TenantId={TenantId}, Phone={Phone}, Name={Name}, HasSummary={HasSummary}",
                tenantId, callerPhone, callerName, !string.IsNullOrEmpty(summary));

            if (tenantId > 0 && !string.IsNullOrEmpty(callerPhone))
            {
                // Caller adı biliniyorsa müşteri kaydını oluştur/güncelle
                // (AI konuşma sırasında save_caller_name çağırmadıysa bile burada güvence altına alınır)
                if (!string.IsNullOrEmpty(callerName))
                    await _customers.CreateOrUpdateAsync(tenantId, callerName, callerPhone);

                var callLog = await _callLogs.StartCallAsync(tenantId, callerPhone, conversationId, null);
                await _callLogs.EndCallAsync(callLog.Id, transcript, summary, null, sentiment);

                _logger.LogInformation("💾 Post-call log saved. ConversationId: {ConversationId}", conversationId);
            }

            return Ok(new { status = "received" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ post-call webhook error");
            return Ok(new { status = "error", message = ex.Message });
        }
    }

    // === Helper Methods ===

    private static string? GetStringProperty(JsonElement element, string propertyName)
    {
        if (element.TryGetProperty(propertyName, out var prop))
        {
            try
            {
                if (prop.ValueKind == JsonValueKind.String)
                    return prop.GetString();
                if (prop.ValueKind == JsonValueKind.Number)
                    return prop.GetRawText();
            }
            catch
            {
                // Fallback for invalid UTF-8 encoding
                return prop.GetRawText().Trim('"');
            }
        }
        return null;
    }

    private static int GetIntProperty(JsonElement element, string propertyName)
    {
        if (element.TryGetProperty(propertyName, out var prop))
        {
            if (prop.ValueKind == JsonValueKind.Number)
                return prop.GetInt32();
            if (prop.ValueKind == JsonValueKind.String && int.TryParse(prop.GetString(), out var val))
                return val;
        }
        return 0;
    }
}

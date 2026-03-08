namespace VoiceAgent.API.Services;

public interface INotificationService
{
    Task SendAppointmentConfirmationAsync(string phone, string customerName, string date, string time, string businessName);
    Task SendAppointmentReminderAsync(string phone, string customerName, string date, string time, string businessName);
}

/// <summary>
/// SMS notification service via Twilio
/// </summary>
public class NotificationService : INotificationService
{
    private readonly IConfiguration _config;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(IConfiguration config, ILogger<NotificationService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendAppointmentConfirmationAsync(string phone, string customerName,
        string date, string time, string businessName)
    {
        var message = $"Hi {customerName}! Your appointment at {businessName} is confirmed for {date} at {time}. " +
                      $"Reply CANCEL to cancel. Thank you!";

        await SendSmsAsync(phone, message);
    }

    public async Task SendAppointmentReminderAsync(string phone, string customerName,
        string date, string time, string businessName)
    {
        var message = $"Reminder: Hi {customerName}, you have an appointment at {businessName} " +
                      $"tomorrow at {time}. We look forward to seeing you!";

        await SendSmsAsync(phone, message);
    }

    private async Task SendSmsAsync(string to, string body)
    {
        try
        {
            var accountSid = _config["Twilio:AccountSid"];
            var authToken = _config["Twilio:AuthToken"];
            var fromNumber = _config["Twilio:PhoneNumber"];

            if (string.IsNullOrEmpty(accountSid) || string.IsNullOrEmpty(authToken))
            {
                _logger.LogWarning("⚠️ Twilio not configured, skipping SMS to {Phone}", to);
                return;
            }

            Twilio.TwilioClient.Init(accountSid, authToken);

            var message = await Twilio.Rest.Api.V2010.Account.MessageResource.CreateAsync(
                body: body,
                from: new Twilio.Types.PhoneNumber(fromNumber),
                to: new Twilio.Types.PhoneNumber(to));

            _logger.LogInformation("📱 SMS sent to {Phone}: {Sid}", to, message.Sid);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SMS sending failed to {Phone}", to);
        }
    }
}

using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

// ElevenLabs outbound call configuration
var elevenLabsApiKey = "sk_3ff829e66059c523920580238685ae883e87b853104765dd";
var agentId = "agent_6201khvtx6t2f61a7hcsfkpmf203";
var toNumber = "+905359358128"; // Your phone number

// Step 1: Get the phone_number_id from ElevenLabs
Console.WriteLine("Fetching phone number ID from ElevenLabs...");

using var httpClient = new HttpClient();
httpClient.DefaultRequestHeaders.Add("xi-api-key", elevenLabsApiKey);

// List phone numbers to find the ID
var phoneNumbersResponse = await httpClient.GetAsync("https://api.elevenlabs.io/v1/convai/phone-numbers");
var phoneNumbersJson = await phoneNumbersResponse.Content.ReadAsStringAsync();

Console.WriteLine($"Phone numbers response: {phoneNumbersJson}");

// Parse to find the phone_number_id (response is a JSON array)
var phoneNumbers = JsonDocument.Parse(phoneNumbersJson);
string? phoneNumberId = null;

var root = phoneNumbers.RootElement;
// Handle both array and object response formats
var numbersArray = root.ValueKind == JsonValueKind.Array ? root : 
    (root.TryGetProperty("phone_numbers", out var prop) ? prop : root);

foreach (var number in numbersArray.EnumerateArray())
{
    phoneNumberId = number.GetProperty("phone_number_id").GetString();
    var label = number.TryGetProperty("label", out var labelProp) ? labelProp.GetString() : "N/A";
    var phoneNum = number.TryGetProperty("phone_number", out var phoneProp) ? phoneProp.GetString() : "N/A";
    Console.WriteLine($"Found: {label} ({phoneNum}) - ID: {phoneNumberId}");
    break; // Use the first one
}

if (string.IsNullOrEmpty(phoneNumberId))
{
    Console.WriteLine("Error: Could not find phone number ID. Check ElevenLabs Phone Numbers config.");
    return;
}

// Step 2: Initiate outbound call via ElevenLabs API
Console.WriteLine($"\nInitiating outbound call to {toNumber}...");

var requestBody = new
{
    agent_id = agentId,
    agent_phone_number_id = phoneNumberId,
    to_number = toNumber
};

var jsonContent = new StringContent(
    JsonSerializer.Serialize(requestBody),
    Encoding.UTF8,
    "application/json"
);

var response = await httpClient.PostAsync(
    "https://api.elevenlabs.io/v1/convai/twilio/outbound-call",
    jsonContent
);

var responseContent = await response.Content.ReadAsStringAsync();
Console.WriteLine($"Status: {response.StatusCode}");
Console.WriteLine($"Response: {responseContent}");

if (response.IsSuccessStatusCode)
{
    Console.WriteLine("\n✅ Call initiated! Check your phone!");
}
else
{
    Console.WriteLine("\n❌ Call failed. Check the error above.");
}

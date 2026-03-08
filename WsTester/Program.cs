using System.Net.WebSockets;
using System.Text;

// Use a known existing tenant ID and call log ID (or arbitrary)
var uri = new Uri("wss://hans-undepreciatory-faviola.ngrok-free.dev/ws/media-stream?tenantId=2&callLogId=9");

using var client = new ClientWebSocket();
try
{
    Console.WriteLine($"Connecting to {uri}...");
    await client.ConnectAsync(uri, CancellationToken.None);
    Console.WriteLine("✅ Connected!");

    // Send a 'connected' event
    var connectedMsg = "{\"event\": \"connected\", \"protocol\": \"Call\", \"version\": \"1.0.0\"}";
    await client.SendAsync(Encoding.UTF8.GetBytes(connectedMsg), WebSocketMessageType.Text, true, CancellationToken.None);
    Console.WriteLine("Sent 'connected' event.");

    // Send 'start' event
    var startMsg = "{\"event\": \"start\", \"sequenceNumber\": \"2\", \"start\": {\"streamSid\": \"MZ12345\", \"accountSid\": \"AC123\", \"callSid\": \"CA123\", \"tracks\": [\"inbound\"], \"mediaFormat\": {\"encoding\": \"audio/x-mulaw\", \"sampleRate\": 8000, \"channels\": 1}}, \"streamSid\": \"MZ12345\"}";
    await client.SendAsync(Encoding.UTF8.GetBytes(startMsg), WebSocketMessageType.Text, true, CancellationToken.None);
    Console.WriteLine("Sent 'start' event.");

    // Send dummy audio (media)
    for (int i = 0; i < 5; i++)
    {
         var mediaMsg = "{\"event\": \"media\", \"sequenceNumber\": \"" + (i + 3) + "\", \"media\": {\"track\": \"inbound\", \"chunk\": \"" + (i + 1) + "\", \"timestamp\": \"" + (i * 20) + "\", \"payload\": \"//4=\"}, \"streamSid\": \"MZ12345\"}";
         await client.SendAsync(Encoding.UTF8.GetBytes(mediaMsg), WebSocketMessageType.Text, true, CancellationToken.None);
         Console.WriteLine($"Sent media chunk {i+1}");
         await Task.Delay(100);
    }

    // Wait for a response (or just keep connection open briefly)
    var buffer = new byte[4096];
    // Give it a second to respond if any
    var timeoutToken = new CancellationTokenSource(3000).Token;
    try {
        var result = await client.ReceiveAsync(buffer, timeoutToken);
        Console.WriteLine($"Received {result.Count} bytes: {Encoding.UTF8.GetString(buffer, 0, result.Count)}");
    } catch (OperationCanceledException) {
        Console.WriteLine("No immediate response (expected if AI is waiting for input).");
    }
    
    await client.CloseAsync(WebSocketCloseStatus.NormalClosure, "Done", CancellationToken.None);
    Console.WriteLine("Closed.");
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Error: {ex.Message}");
    if (ex.InnerException != null) Console.WriteLine($"Inner: {ex.InnerException.Message}");
}

# 🤖 VoiceAgent — AI-Powered Phone Receptionist

An autonomous voice agent that answers phone calls, speaks in a human-like voice, and handles appointments — just like a real receptionist, but 24/7.

---

## What It Does

When a customer calls your business number:

1. **AI picks up the phone** — powered by Twilio
2. **Speaks naturally** — human-like voice via ElevenLabs
3. **Handles appointments** — books, cancels, reschedules
4. **Analyzes sentiment** — detects customer mood in real-time
5. **Logs everything** — all conversations tracked in the dashboard

No hold music. No missed calls. No sick days.

---

## Who Is This For

- 🏥 Clinics & dental offices
- 💇 Hair salons & beauty studios
- 🍽️ Restaurants with reservations
- 🏢 Any appointment-based business

A receptionist costs ~$500-800/month. This system does the same job, 24/7, at a fraction of the cost.

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Phone & Calls | Twilio |
| Voice Synthesis | ElevenLabs |
| AI Brain | GPT-4o Mini |
| Backend API | C# (.NET) |
| Dashboard | JavaScript |
| Landing Page | HTML/CSS/JS |
| Database | SQL (seed.sql included) |
| Deployment | Docker (deploy/) |

---

## Project Structure

```
VoiceAgent/
├── VoiceAgent.API/    # Core API — call handling, AI orchestration
├── TwilioHelper/      # Twilio integration layer
├── Dashboard/         # Admin panel — view calls, sentiment, appointments
├── LandingPage/       # Customer-facing onboarding page
├── WsTester/          # WebSocket testing utility
├── deploy/            # Deployment configs
├── seed.sql           # Database seed data
├── test_postcall.py   # Post-call analysis testing
└── .env.example       # Environment variables template
```

---

## Getting Started

### Prerequisites

- .NET SDK
- Node.js
- Twilio account
- ElevenLabs API key
- OpenAI API key

### Setup

1. Clone the repo:
```bash
git clone https://github.com/kaganbektas/VoiceAgent.git
cd VoiceAgent
```

2. Copy and fill environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. Set up the database:
```bash
# Run seed.sql in your database
```

4. Run the API:
```bash
cd VoiceAgent.API
dotnet run
```

5. Run the Dashboard:
```bash
cd Dashboard
# Follow setup instructions
```

---

## How It Works

```
📞 Incoming Call (Twilio)
    ↓
🎤 Speech-to-Text
    ↓
🧠 GPT-4o Mini (intent detection, response generation)
    ↓
🗣️ ElevenLabs (natural voice synthesis)
    ↓
📊 Sentiment Analysis + Logging → Dashboard
```

---

## Features

- **Real-time voice conversation** — low latency, natural flow
- **Appointment management** — create, cancel, reschedule via voice
- **Sentiment analysis** — track customer satisfaction per call
- **Admin dashboard** — monitor all calls, view analytics
- **Landing page** — ready-made onboarding for new clients
- **WebSocket support** — real-time audio streaming

---

## License

MIT

---

## Contact

**Alpkağan Bektaş**

- [LinkedIn](https://www.linkedin.com/in/alpka%C4%9Fan-bekta%C5%9F-30bb893b5/)
- Email: kaganbektas34@gmail.com

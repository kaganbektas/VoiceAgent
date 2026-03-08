# VoiceAgent — Build & Deploy Instructions

## Prerequisites
- Linux server (Ubuntu 22.04+)
- .NET 8 SDK on build machine
- Node.js 18+ on build machine
- PostgreSQL on server
- Nginx on server
- Domain name pointed to server IP

## 1. Build Backend
```bash
cd VoiceAgent/VoiceAgent.API
dotnet publish -c Release -o ../deploy/publish --self-contained false -r linux-x64
```

## 2. Build Frontend
```bash
cd VoiceAgent/Dashboard
npm ci
npm run build
cp -r dist ../deploy/dist
```

## 3. Configure
Edit `deploy/nginx.conf`:
- Replace `voiceagent.yourdomain.com` with your actual domain

Edit `deploy/publish/appsettings.json`:
- Set `ConnectionStrings:DefaultConnection` to your production PostgreSQL
- Set `Stripe:SecretKey` and `Stripe:WebhookSecret` from Stripe dashboard
- Set `Twilio:AccountSid`, `AuthToken`, `PhoneNumber` from Twilio console
- Set `OpenAI:ApiKey` from OpenAI dashboard
- Set `Jwt:Key` to a strong random string (64+ chars)

## 4. Deploy
```bash
cd deploy
scp -r . user@yourserver:/tmp/voiceagent-deploy
ssh user@yourserver
cd /tmp/voiceagent-deploy
chmod +x deploy.sh
./deploy.sh
```

## 5. SSL Certificate
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d voiceagent.yourdomain.com
```

## 6. Database Migration
```bash
cd /var/www/voiceagent/api
dotnet ef database update
```

## URL Structure (Production)
| URL | What |
|-----|------|
| `voiceagent.com/` | Landing page |
| `voiceagent.com/login` | Login |
| `voiceagent.com/register` | Register |
| `voiceagent.com/dashboard` | Admin dashboard |
| `voiceagent.com/dashboard/calls` | Call history |
| `voiceagent.com/api/...` | Backend API |

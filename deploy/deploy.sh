#!/bin/bash
# VoiceAgent Deployment Script
# Run on your Linux server

set -e

APP_NAME="voiceagent"
APP_DIR="/var/www/$APP_NAME"
API_DIR="$APP_DIR/api"
FRONTEND_DIR="$APP_DIR/frontend"
SERVICE_NAME="voiceagent-api"

echo "🚀 Deploying VoiceAgent..."

# Create directories
sudo mkdir -p $API_DIR $FRONTEND_DIR

# =================== BACKEND ===================
echo "📦 Deploying .NET API..."

# Copy published API files
sudo cp -r ./publish/* $API_DIR/

# Create systemd service
sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null <<EOF
[Unit]
Description=VoiceAgent API
After=network.target postgresql.service

[Service]
WorkingDirectory=$API_DIR
ExecStart=/usr/bin/dotnet $API_DIR/VoiceAgent.API.dll
Restart=always
RestartSec=5
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://localhost:5119

[Install]
WantedBy=multi-user.target
EOF

# =================== FRONTEND ===================
echo "🎨 Deploying Frontend..."
sudo cp -r ./dist/* $FRONTEND_DIR/

# =================== NGINX ===================
echo "🌐 Configuring Nginx..."
sudo cp ./nginx.conf /etc/nginx/sites-available/$APP_NAME
sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/$APP_NAME
sudo nginx -t && sudo systemctl reload nginx

# =================== START ===================
echo "▶️ Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl restart $SERVICE_NAME

echo ""
echo "✅ VoiceAgent deployed successfully!"
echo "   API:      http://localhost:5119"
echo "   Frontend: https://voiceagent.yourdomain.com"
echo ""
echo "📋 Next steps:"
echo "   1. Update 'voiceagent.yourdomain.com' in nginx.conf with your actual domain"
echo "   2. Run: sudo certbot --nginx -d yourdomain.com"
echo "   3. Update appsettings.json with production database & API keys"

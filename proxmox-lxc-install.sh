#!/bin/bash
# Script d'installation et de mise à jour automatique pour conteneur LXC Proxmox (Debian / Ubuntu)
set -e

echo "=== Installation / Mise à jour de l'application Suivi des Trajets sur Proxmox LXC ==="

APP_DIR="$(pwd)"
if [ "$APP_DIR" = "/" ]; then
    APP_DIR="/root/Suivi-Temps"
fi

# Mise à jour des paquets de base
apt update && apt install -y curl nginx git sqlite3 build-essential python3

# Installation de Node.js si non présent
if ! command -v node &> /dev/null; then
    echo "Installation de Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

echo "Compilation de l'application..."
npm install
npm run build

# Déploiement des fichiers statiques vers Nginx
echo "Copie vers /var/www/html..."
mkdir -p /var/www/html
rm -rf /var/www/html/*
cp -r dist/* /var/www/html/

# Création du service systemd pour le serveur API SQLite
echo "Configuration du service systemd (suivi-temps)..."
cat << EOF > /etc/systemd/system/suivi-temps.service
[Unit]
Description=Suivi des Trajets - API SQLite Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${APP_DIR}
ExecStart=$(which node) ${APP_DIR}/dist/server.cjs
Restart=always
RestartSec=3
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=DATABASE_PATH=${APP_DIR}/trajets.db

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable suivi-temps
systemctl restart suivi-temps

# Configuration Nginx avec proxy pour /api/
echo "Configuration de Nginx avec Reverse Proxy /api/..."
cat << 'EOF' > /etc/nginx/sites-available/default
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    root /var/www/html;
    index index.html;
    server_name _;

    # Proxy pour l'API SQLite
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # SPA Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

nginx -t
systemctl restart nginx

IP_ADDR=$(hostname -I | awk '{print $1}')
echo "=========================================================="
echo "Installation & synchronisation SQLite terminées avec succès !"
echo "Service API : Actif sur le port 3000 (trajets.db)"
echo "Accès Web local : http://${IP_ADDR}"
echo "=========================================================="

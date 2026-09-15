#!/bin/bash
# Script d'installation automatique pour conteneur LXC Proxmox (Debian / Ubuntu)
set -e

echo "=== Installation de l'application Suivi des Trajets sur Proxmox LXC ==="

# Mise à jour des paquets
apt update && apt install -y curl nginx git

# Installation de Node.js 20 si non installé
if ! command -v node &> /dev/null; then
    echo "Installation de Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# Compilation de l'application
echo "Installation des dépendances et compilation..."
npm install
npm run build

# Déploiement vers Nginx
echo "Copie vers /var/www/html..."
rm -rf /var/www/html/*
cp -r dist/* /var/www/html/

# Configuration Nginx
cat << 'EOF' > /etc/nginx/sites-available/default
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    root /var/www/html;
    index index.html;
    server_name _;

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
echo "Installation terminée avec succès !"
echo "Votre application est disponible sur : http://${IP_ADDR}"
echo "=========================================================="

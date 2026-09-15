import React, { useState } from 'react';
import {
  Server,
  X,
  Copy,
  Check,
  Terminal,
  Cpu,
  ShieldCheck,
  ExternalLink,
  Download,
  Layers,
} from 'lucide-react';

interface ProxmoxLxcModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProxmoxLxcModal: React.FC<ProxmoxLxcModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'nginx' | 'docker' | 'pm2'>('nginx');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const nginxScript = `# 1. Dans la console de votre LXC (Debian ou Ubuntu) sur Proxmox :
apt update && apt install -y nginx curl git

# 2. Cloner ou transférer les fichiers de l'application :
git clone <URL_DU_DEPOT> /opt/suivi-trajets
cd /opt/suivi-trajets

# 3. Installer Node.js et compiler le projet :
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install
npm run build

# 4. Déployer vers le dossier web Nginx :
rm -rf /var/www/html/*
cp -r dist/* /var/www/html/

# 5. Configurer Nginx pour le routage SPA :
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

nginx -t && systemctl restart nginx
# Votre application est accessible sur http://<IP_DU_LXC> !`;

  const dockerCompose = `version: '3.8'
services:
  suivi-trajets:
    image: nginx:alpine
    container_name: suivi-trajets
    restart: unless-stopped
    ports:
      - "3000:80"
    volumes:
      - ./dist:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro`;

  const pm2Script = `# Déploiement en mode Node.js direct dans le LXC :
apt update && apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

cd /opt/suivi-trajets
npm install
npm run build
npm install -g serve pm2

# Lancement en tâche de fond persistante au reboot de Proxmox :
pm2 start "serve -s dist -l 3000" --name "suivi-trajets"
pm2 save
pm2 startup`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="proxmox-modal-content"
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Déploiement sur LXC Proxmox VE</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Autonome & Léger (&lt; 30 Mo RAM)
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Guide d'installation étape par étape sur un conteneur Debian ou Ubuntu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Proxmox LXC Specs Recommandées */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Ressources requises</p>
                <p className="text-xs font-bold text-slate-800">1 vCPU • 512 Mo RAM</p>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-500 font-medium">OS Recommandé</p>
                <p className="text-xs font-bold text-slate-800">Debian 12 / Ubuntu 24.04</p>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Type de conteneur</p>
                <p className="text-xs font-bold text-slate-800">Unprivileged LXC (Sûr)</p>
              </div>
            </div>
          </div>

          {/* Methods Tabs */}
          <div>
            <div className="flex border-b border-slate-200 space-x-4 mb-4 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('nginx')}
                className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'nginx'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Nginx natif (Recommandé & Ultra-léger)
              </button>
              <button
                onClick={() => setActiveTab('docker')}
                className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'docker'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                2. Docker Compose dans le LXC
              </button>
              <button
                onClick={() => setActiveTab('pm2')}
                className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'pm2'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                3. Node.js & PM2
              </button>
            </div>

            {/* Tab content */}
            {activeTab === 'nginx' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Cette méthode est la plus performante sur Proxmox. L'application est compilée en fichiers statiques servis par Nginx. Consommation mémoire : <strong>moins de 15 Mo de RAM</strong> !
                </p>
                <div className="relative">
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed max-h-72">
                    <code>{nginxScript}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(nginxScript, 'nginx')}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1 text-xs"
                    title="Copier le script"
                  >
                    {copiedId === 'nginx' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'docker' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Si vous avez activé Docker / Nesting dans les options de votre LXC Proxmox (Option <code>features: nesting=1</code>) :
                </p>
                <div className="relative">
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
                    <code>{dockerCompose}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(dockerCompose, 'docker')}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1 text-xs"
                  >
                    {copiedId === 'docker' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'pm2' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Exécution sous Node.js avec redémarrage automatique en tâche de fond via PM2 :
                </p>
                <div className="relative">
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
                    <code>{pm2Script}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(pm2Script, 'pm2')}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1 text-xs"
                  >
                    {copiedId === 'pm2' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Persistance note */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
            <h4 className="font-bold text-blue-950 mb-1 flex items-center gap-1.5">
              <span>💡 Sauvegardes & Restauration Proxmox</span>
            </h4>
            <p className="leading-relaxed">
              Vos données sont conservées dans le stockage local du navigateur de votre appareil et vous pouvez à tout moment utiliser le bouton <strong>Sauvegarde JSON</strong> dans l'en-tête pour exporter vos trajets, ou planifier un snapshot régulier de votre conteneur LXC directement depuis l'interface web de Proxmox VE (menu <em>Sauvegarde / Backup</em>).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
          >
            Fermer le guide
          </button>
        </div>
      </div>
    </div>
  );
};

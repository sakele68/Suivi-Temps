import React, { useState } from 'react';
import {
  GitBranch,
  X,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  Laptop,
  Server,
  Download,
  FolderGit2,
} from 'lucide-react';

interface GitHubInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubInstallModal: React.FC<GitHubInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const cloneAndRunScript = `# 1. Cloner votre dépôt GitHub
git clone <URL_DE_VOTRE_DEPOT_GITHUB>
cd suivi-trajets

# 2. Installer les dépendances
npm install

# 3. Lancer l'application en local
npm run dev

# L'application est disponible sur : http://localhost:3000`;

  const buildProductionScript = `# Compiler l'application pour la production
npm run build

# Prévisualiser la version de production en local
npm run preview`;

  const lxcProxmoxGitScript = `# Sur votre serveur / conteneur Proxmox LXC (Debian ou Ubuntu) :
apt update && apt install -y git curl nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Cloner depuis GitHub directement dans le dossier /opt :
git clone <URL_DE_VOTRE_DEPOT_GITHUB> /opt/suivi-trajets
cd /opt/suivi-trajets

# Compiler et déployer sous Nginx :
npm install
npm run build
rm -rf /var/www/html/*
cp -r dist/* /var/www/html/
systemctl restart nginx`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="github-install-modal"
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Installation depuis GitHub</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                  Guide Rapide
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Comment récupérer le code et l'exécuter sur votre machine ou serveur
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Étape 1 : Exporter le code vers GitHub */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                1
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-slate-900 text-sm">
                  Exporter ou publier ce projet vers votre compte GitHub
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Depuis le menu supérieur de Google AI Studio, cliquez sur <strong>Export</strong> (ou l'icône de partage/paramètres) puis sélectionnez <strong>Export to GitHub</strong> (ou téléchargez le fichier <strong>ZIP</strong> pour le déposer dans un nouveau dépôt GitHub).
                </p>
              </div>
            </div>
          </div>

          {/* Étape 2 : Cloner et exécuter sur votre ordinateur */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                2
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-slate-600" />
                  <span>Installation sur PC / Mac / Linux</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Ouvrez votre terminal ou invite de commande et exécutez les instructions suivantes :
                </p>
              </div>
            </div>

            <div className="relative mt-2">
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
                <code>{cloneAndRunScript}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(cloneAndRunScript, 'clone')}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1 text-xs cursor-pointer"
                title="Copier les commandes"
              >
                {copiedId === 'clone' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-sans">Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="font-sans">Copier</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Étape 3 : Déploiement sur Proxmox LXC ou Serveur */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                3
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-600" />
                  <span>Installation automatique sur serveur / Proxmox LXC</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Pour cloner directement votre dépôt GitHub sur votre conteneur LXC :
                </p>
              </div>
            </div>

            <div className="relative mt-2">
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
                <code>{lxcProxmoxGitScript}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(lxcProxmoxGitScript, 'proxmox-git')}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1 text-xs cursor-pointer"
                title="Copier le script Proxmox"
              >
                {copiedId === 'proxmox-git' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-sans">Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="font-sans">Copier</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Astuce de mise à jour continue */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
            <h4 className="font-bold mb-1 flex items-center gap-1.5">
              <span>🔄 Mettre à jour facilement les futures versions</span>
            </h4>
            <p className="leading-relaxed text-slate-700">
              Chaque fois que vous modifiez l'application ou poussez des modifications sur GitHub, il vous suffit de lancer dans le dossier :
              <code className="block mt-1 font-mono font-semibold bg-emerald-100/70 p-1.5 rounded text-emerald-900">
                git pull && npm install && npm run build
              </code>
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

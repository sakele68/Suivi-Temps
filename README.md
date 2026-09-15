# Suivi des Trajets 🚗⏱️

Application de gestion et suivi des trajets professionnels et personnels : saisie de lieu, motif, date, horaires de départ et d'arrivée, calcul automatique des durées (en heures, minutes, décimal et gestion nuit/lendemain), filtrage avancé et export vers **Excel (.xlsx)** et **CSV**.

---

## 🚀 Installation rapide depuis GitHub

### Prérequis
- **Node.js** v18+ ou v20+ (recommandé v20 LTS) : [nodejs.org](https://nodejs.org/)
- **Git** : [git-scm.com](https://git-scm.com/)

---

### 1. Cloner le dépôt GitHub

Ouvrez un terminal ou PowerShell :

```bash
git clone https://github.com/<votre-nom-utilisateur>/<nom-du-depot>.git
cd <nom-du-depot>
```

---

### 2. Installer les dépendances

```bash
npm install
```

---

### 3. Lancer l'application

#### Mode Développement (avec rechargement en direct) :
```bash
npm run dev
```
L'application démarre sur [http://localhost:3000](http://localhost:3000).

#### Mode Production (Build & Preview) :
```bash
npm run build
npm run preview
```

---

## 🐳 Déploiement Docker (Optionnel)

Vous pouvez également lancer l'application dans un conteneur Docker :

```bash
# Compiler l'application
npm run build

# Lancer avec un conteneur Nginx léger
docker run -d --name suivi-trajets -p 3000:80 -v $(pwd)/dist:/usr/share/nginx/html:ro nginx:alpine
```
Puis accédez à l'application sur [http://localhost:3000](http://localhost:3000).

---

## 📦 Déploiement sur Proxmox VE (Conteneur LXC)

Dans la console de votre LXC (Debian 12 ou Ubuntu 24.04) :

```bash
# 1. Mettre à jour et installer Nginx, Git et Node.js
apt update && apt install -y nginx git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 2. Cloner le projet depuis GitHub
git clone https://github.com/<votre-nom-utilisateur>/<nom-du-depot>.git /opt/suivi-trajets
cd /opt/suivi-trajets

# 3. Installer et compiler
npm install
npm run build

# 4. Déployer vers le serveur web Nginx
rm -rf /var/www/html/*
cp -r dist/* /var/www/html/

# 5. Redémarrer Nginx
systemctl restart nginx
```
L'application est disponible sur l'adresse IP de votre conteneur : `http://<IP_DU_LXC>`.

---

## 🛠️ Fonctionnalités incluses

- 📍 **Saisie complète des trajets** : Lieu, Motif (intervention, réunion, chantier...), Date, Heure départ, Heure arrivée, Notes.
- ⏱️ **Calculs précis et instantanés** : Durée en heures et minutes (`X h YY min`), format décimal (`X.XX h`), détection automatique des trajets de nuit / lendemain (`+1j`).
- 📊 **Tableaux de bord et synthèses** : Cumul total, répartition par lieu/destination et par date.
- 📥 **Exports complets** : Export Excel bicolore (`.xlsx`) multi-feuilles et export CSV compatible tableurs.
- 💾 **Sauvegarde & Restauration** : Export / import de sauvegarde au format JSON pour ne jamais perdre vos données.
- 📱 **100% Responsive & Hors-ligne** : Utilisable sur PC, tablette et smartphone.

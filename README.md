# WebForge AI 🚀

Plateforme SaaS de génération de sites web par Intelligence Artificielle. Architecture Serverless propulsée par Supabase.

## 📋 Fonctionnalités

- **Générateur IA** : Wizard en 5 étapes pour créer des sites complets (Landing, Portfolio, Blog).
- **Éditeur de Code** : Intégration de Monaco Editor (VS Code web) pour l'édition en temps réel avec coloration syntaxique.
- **Authentification** : Gestion complète via Supabase Auth (Email, Google, GitHub) avec persistance de session.
- **Dashboard** : Gestion des projets, analytics (KPIs, graphiques) et profil utilisateur.
- **Sécurité** : Row Level Security (RLS) pour l'isolation stricte des données utilisateurs.
- **Preview** : Système de prévisualisation en temps réel via Blob URL et injection dynamique.

## 🛠 Prérequis

- Un compte [Supabase](https://supabase.com) (Gratuit).
- Un serveur web local (VS Code Live Server, Python http.server, Node http-server) pour supporter les modules ES6.
- Un navigateur moderne (Chrome, Firefox, Edge).

## ⚙️ Installation & Configuration

### 1. Cloner le projet

```bash
git clone https://github.com/votre-username/webforge-ai.git
cd webforge-ai
```

### 2. Configuration Supabase

1. Créez un nouveau projet sur [Supabase](https://app.supabase.com).
2. Allez dans **SQL Editor** (barre latérale gauche).
3. Copiez l'intégralité du contenu du fichier `schema.sql` fourni dans ce projet.
4. Collez-le dans l'éditeur SQL et cliquez sur **Run** pour créer les tables, triggers et politiques de sécurité (RLS).

### 3. Configuration du Stockage (Storage)

1. Allez dans **Storage** sur Supabase.
2. Créez un nouveau bucket public nommé `avatars`.
3. (Optionnel) Créez un bucket public nommé `project-assets` pour les images générées.

### 4. Configuration de l'Authentification

1. Allez dans **Authentication > Providers**.
2. Activez **Email**.
3. (Optionnel) Activez **Google** ou **GitHub** en fournissant les Client ID/Secret obtenus sur les consoles développeurs respectives.
4. Dans **URL Configuration**, ajoutez l'URL de votre site (ex: `http://localhost:5500` ou votre URL de production) dans **Site URL** et **Redirect URLs**.

### 5. Lier le Frontend

1. Ouvrez le fichier `supabaseClient.js` à la racine du projet.
2. Remplacez les variables par vos clés API (disponibles dans **Project Settings > API**) :

```javascript
const SUPABASE_URL = 'VOTRE_URL_SUPABASE' // ex: https://xyz.supabase.co
const SUPABASE_ANON_KEY = 'VOTRE_CLE_ANON_PUBLIC'
```

## 🚀 Lancement

Ce projet utilise des modules ES6 (`type="module"`), il ne peut pas être ouvert directement via le protocole `file://`.

**Option A : VS Code Live Server (Recommandé)**
1. Installez l'extension "Live Server" dans VS Code.
2. Faites un clic droit sur `index.html` > "Open with Live Server".

**Option B : Python**
```bash
# Python 3
python3 -m http.server 8000
# Ouvrez http://localhost:8000
```

**Option C : Node.js**
```bash
npx serve .
```

## 📦 Déploiement

Le projet est statique (HTML/CSS/JS). Vous pouvez le déployer gratuitement sur n'importe quel hébergeur statique :

- **Vercel** : Importez le repo Git, aucune configuration de build requise.
- **Netlify** : Drag & drop du dossier ou import Git.
- **GitHub Pages** : Activez Pages dans les paramètres du repo.

**⚠️ Important :** Une fois déployé, ajoutez l'URL de production (ex: `https://mon-projet.vercel.app`) dans la liste des **Redirect URLs** de Supabase Auth pour que l'OAuth et les liens magiques fonctionnent.

## 📂 Structure du Projet

- `/` : Pages HTML publiques (index, features, pricing) et privées (dashboard, editor, wizard).
- `style.css` : Design system global, variables CSS, et styles spécifiques (Monaco, Dashboard).
- `script.js` : Logique UI globale (Menu mobile, Toast notifications, Animations scroll).
- `supabaseClient.js` : Initialisation du client Supabase.
- `auth-oauth.js` : Fonctions d'authentification (Login, Register, Logout, Session Check).
- `editor-logic.js` : Logique de l'IDE (Chargement fichiers, Monaco Editor, Auto-save, Preview).
- `generator-logic.js` : Logique du Wizard IA (Étapes, State management, Mock génération).
- `schema.sql` : Script de création de la base de données PostgreSQL.

## 🛡️ Sécurité

Les règles RLS (Row Level Security) définies dans `schema.sql` garantissent que :
- Les utilisateurs ne peuvent voir et modifier que leurs propres projets.
- Les fichiers de code source sont strictement isolés par utilisateur.
- Les profils utilisateurs sont protégés en écriture (seul le propriétaire peut modifier son profil).
- L'accès aux pages privées est vérifié côté client via `protectPrivatePage()` et sécurisé côté serveur par RLS.
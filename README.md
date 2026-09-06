# Histo14Bus 🚍 — Refonte & Modernisation du Réseau Twisto & Normandie

Bienvenue sur le projet modernisé de **Histo14Bus**, la plateforme dédiée au recensement, à l'historique et à la photothèque du parc de bus et tramways **Twisto (Caen la mer)** ainsi que des réseaux normands (**Astuce Rouen**, **LiA Le Havre**).

---

## ✨ Nouveautés & Améliorations par rapport à l'ancien site Wix

1. **Recherche Universelle & Instantanée (`Ctrl+K` ou `⌘K`)** :
   - Recherche en temps réel par numéro de parc (ex: `5220`, `1004`), immatriculation, modèle ou ligne de bus.
2. **Filtres Multi-critères Dynamiques** :
   - Statut : *Parc Actuel (En service)* vs *Parc Réformé*.
   - Séries : *Série 1000 (Tramway Citadis)*, *Série 5200 (Urbanway 12 GNV)*, *Série 7200 (Urbanway 18 GNV)*, *Série 8200 (Citaro C2)*, *Série 300/400 (Citelis 12/18)*...
   - Énergie : *🌿 BioGNV / Gaz*, *⚡ Électrique*, *🔋 Hybride*, *⛽ Diesel*.
   - Type : *Standard*, *Articulé*, *Tramway*, *Minibus*.
3. **Fiche Véhicule Haute Définition (Fini les 100+ sous-pages Wix à créer manuellement !)** :
   - Affichage complet : Photos HD, plaque d'immatriculation avec bandeau Calvados 14, caractéristiques techniques, livrée, lignes habituelles, chronologie de vie du bus, bouton de partage direct.
4. **Explorateur de Lignes Twisto** :
   - Lignes Tramway (T1, T2, T3), Lianes (1, 2, 3, 4), Urbaines, Express (11 Express), Twistoflex et Noctibus aux couleurs officielles.
5. **Journal des Mouvements & Le MAG** :
   - Suivi chronologique des réceptions, mutations entre réseaux et réformes.
   - Articles complets (Projet Tramway 2029, passage au BioGNV).
6. **Outil Gestionnaire de Flotte (Admin intégré)** :
   - Bouton **"Gérer Flotte"** en haut à droite permettant d'ajouter un véhicule via un formulaire simple et de télécharger le fichier `fleet.json` mis à jour en 1 clic !

---

## 🚀 Comment lancer et tester le site sur votre ordinateur

Double-cliquez simplement sur le fichier **`index.html`** pour l'ouvrir dans n'importe quel navigateur (Google Chrome, Firefox, Microsoft Edge, Safari).

---

## 📁 Organisation des Fichiers

```
site wixe/
├── index.html              # Interface principale ultra-rapide (Single Page App)
├── assets/
│   ├── css/
│   │   └── style.css       # Thème Twisto, plaque Normandie 14, animations, mode sombre
│   └── js/
│       ├── app.js          # Moteur de recherche globale, onglets, mode sombre, lightbox
│       ├── fleet.js        # Gestion et affichage du parc de bus/trams
│       ├── lines.js        # Catalogue interactif des lignes du réseau
│       └── admin.js        # Assistant d'ajout de bus et export de la base de données
├── data/
│   ├── fleet.json          # Base de données complète du parc de véhicules
│   ├── lines.json          # Liste complète des lignes de transport
│   ├── movements.json      # Historique des arrivées, cessions et réformes
│   └── news.json           # Articles d'actualités et dossiers Le MAG
└── README.md
```

---

## 🌐 Options d'Hébergement & Déploiement

### Option 1 : Hébergement 100% Gratuit sur GitHub Pages / Vercel (Recommandé)
1. Créez un dépôt GitHub et déposez-y les fichiers de ce dossier.
2. Activez **GitHub Pages** dans les paramètres du dépôt (Settings > Pages > Deploy from main branch).
3. Votre site sera instantanément en ligne avec une vitesse d'affichage éclair (< 0.5s) et sans frais !

### Option 2 : Intégration sur Wix (Iframe / HTML Embed)
Si vous souhaitez conserver votre nom de domaine Wix :
1. Sur l'éditeur Wix, ajoutez un élément **"Intégration HTML" (Code Embed / iframe)**.
2. Pointez vers l'URL de votre application hébergée (ou insérez le code HTML).

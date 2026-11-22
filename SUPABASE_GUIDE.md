# Guide de Connexion & Migration Supabase — Histo14Bus

Ce guide récapitule la connexion de votre site **Histo14Bus** à votre projet **Supabase** et la migration de vos données.

---

## 1. Informations de votre projet Supabase

- **URL Supabase** : `https://ovtldavqzacgjtjcjarv.supabase.co`
- **Clé Publique (Publishable Key)** : `sb_publishable_VGkYNWrb6YOeGK3B0SydEw_AUViiYf9`

---

## 2. Étape clé : Créer les tables et insérer les données (1 clic)

Les clés API clientes (publishable/anon) ne permettent pas d'exécuter des requêtes SQL structurelles (`CREATE TABLE`). 
Pour initialiser votre base de données avec l'ensemble des tables et toutes les données existantes (285 véhicules, 68 lignes, actualités, mouvements, galerie) :

1. Ouvrez votre tableau de bord Supabase :  
   👉 **[https://supabase.com/dashboard/project/ovtldavqzacgjtjcjarv/sql/new](https://supabase.com/dashboard/project/ovtldavqzacgjtjcjarv/sql/new)**
2. Ouvrez le fichier **`supabase_setup_and_data.sql`** situé à la racine du projet (ou copiez son contenu).
3. Collez tout le code SQL dans l'éditeur Supabase.
4. Cliquez sur le bouton vert **"Run"** (ou Ctrl + Entrée).

### Ce que fait ce script automatique :
- Crée les 5 tables : `vehicles`, `lines`, `news`, `movements`, `gallery`
- Crée les vues synonymes en français : `vehicules`, `lignes`, `mag_articles`, `mouvements`, `galerie`
- Active la sécurité **Row Level Security (RLS)** avec lecture et écriture publiques (compatibles avec votre interface d'administration)
- Insère immédiatement l'intégralité de vos **285 véhicules**, **68 lignes de transport**, **actualités**, **mouvements** et **photos** avec gestion des conflits (`ON CONFLICT DO UPDATE`).

---

## 3. Fonctionnement automatique sur le site

Votre site est désormais 100% connecté :
- **Au chargement** : Le site tente de charger les données directement depuis **Supabase**. Si la connexion est temporairement inaccessible, il bascule automatiquement sur le cache local / fichiers JSON sans jamais bloquer l'affichage.
- **Dans l'Espace Administrateur** : Chaque ajout, modification ou suppression d'un véhicule, d'une ligne, d'un article ou d'une photo est automatiquement répercuté en temps réel dans votre base Supabase !
- **Dans l'onglet "Sauvegardes / JSON" de l'Espace Admin** : Un bouton **"Transférer toutes les données vers Supabase"** permet de relancer une synchronisation complète à tout moment.

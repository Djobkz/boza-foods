# Boza Foods — application de commandes

## Ce que cette version fait
- Commandes Sur place / À emporter
- Menu Boza Foods avec les prix fournis
- Fromage rouge +100 DA
- Sans laitue / Sans tomates / Sans épices
- Quantités et calcul automatique
- Numéro automatique de commande
- Écran Cuisine
- Statuts : Nouvelle → En préparation → Prêt
- Historique partagé
- Synchronisation temps réel entre les téléphones
- PWA installable sur téléphone

## Installation gratuite

### 1. Créer le backend
Créer un projet gratuit sur Supabase.

### 2. Créer les tables
Dans Supabase : SQL Editor → colle tout le contenu de `schema.sql` → Run.

### 3. Créer les comptes
Dans Supabase : Authentication → Users → Add user.
Crée au minimum deux comptes :
- ton téléphone
- téléphone cuisine

Tu peux utiliser deux emails différents et des mots de passe forts.

### 4. Mettre les clés dans config.js
Dans Supabase : Project Settings → API.
Copie :
- Project URL
- anon public key

dans `config.js`.

NE METS JAMAIS la clé `service_role` dans le site.

### 5. Publier gratuitement
Le plus simple : GitHub Pages.
- crée un dépôt GitHub
- mets tous les fichiers du dossier dedans
- Settings → Pages → Deploy from branch → main
- ouvre l'adresse générée sur les deux téléphones
- connecte chaque téléphone avec son compte

### 6. Installer comme une application
Sur Android/Chrome :
Menu ⋮ → Ajouter à l'écran d'accueil.

## Important
Cette version est déjà structurée pour deux téléphones, mais les clés Supabase ne sont volontairement pas incluses. Elles dépendent de TON projet Supabase.

## Menu intégré
Burger:
Chicken burger 250 DA
Cheese burger 300 DA
Double cheese 450 DA
Smoked burger 550 DA
Smash burger 650 DA

Tacos:
Poulet 400 DA
Foie 450 DA
Viande 500 DA
Mixte 550 DA

Fajitas:
Poulet 350 DA
Foie 400 DA
Viande 550 DA
Mixte 500 DA

Sandwichs:
Poulet 300 DA
Foie 400 DA
Viande 450 DA
Mixte 450 DA
4 fromage 500 DA
Boza sandwich 650 DA

Suppléments:
Œuf 50 DA
Gruyère 100 DA
Gouda 100 DA
Mozzarella 100 DA
Camembert 100 DA
Kiri 150 DA
Poulet fumé 100 DA
Frites 100 DA
Viande 150 DA
Fromage rouge 100 DA

Boissons:
Canette 100 DA
Eau minérale 50cl 30 DA
Gazeuse 1L 150 DA
Eau minérale 1L 50 DA

Menu frites + soda: +150 DA pour un article principal.

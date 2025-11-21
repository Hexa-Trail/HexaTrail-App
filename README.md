# HexaTrail – Analyse de données & Cinématique

L’application HexaTrail permet de charger, visualiser et analyser des runs de télémétrie VTT.  
Elle fonctionne entièrement dans le navigateur (pas d’installation requise) et permet également d’analyser la cinématique d’un vélo via un outil dédié.

---

## 🚀 Fonctionnalités principales

### 📈 Analyse de runs
- Chargement de fichiers d’acquisition (télémétrie)
- Affichage des courbes clés :
  - débattement
  - vitesse de compression
  - zones d’utilisation de suspension
- Comparaison de runs
- Statistiques automatiques

### 🔧 Outil de cinématique
- Sélection de points de pivot sur une image
- Définition d’une longueur de référence
- Calcul de :
  - courbe de leverage ratio
  - débattement système
  - progressivité
- Visualisation interactive

### 🖥️ Interface
- Design clair, inspiré du site vitrine
- Boutons, cartes et ombres compatibles avec une future feuille de style commune
- Responsive, utilisable sur ordinateur ou tablette

---

## 🧱 Structure du projet

```
HexaTrail-App/
│── index.html
│── style.css
│── script.js
│── modules/           # Découpage logique (analyse, kinematics, utils…)
│── assets/
│     ├── icons/
│     └── sample_data/
└── README.md
```

---

## 🔧 Technologies utilisées

- **HTML/CSS/JS**
- Pas de frameworks lourds pour garder l’app légère
- Calculs de cinématique en JavaScript pur
- Composants réutilisables structurés (boutons, cartes, modales…)

---

## 📦 Utilisation

1. Ouvrir le lien GitHub Pages dans un navigateur
2. Choisir :
   - 📈 *Analyse d’un run*
   - 📐 *Outil de cinématique*
3. Charger un fichier ou une image
4. Explorer les graphiques et résultats

---

## 🌐 Déploiement

L’application est hébergée via **GitHub Pages**.  
Le JavaScript n’étant pas mis en cache agressif, les modifications sont visibles immédiatement.

---

## 🛠️ Développement

Les points clés à respecter :
- Le code JS est organisé par modules
- La sélection des pivots utilise un système d’événements contrôlé
- Les calculs sont immédiatement visualisables
- Les styles évoluent pour converger vers un design commun au site vitrine

Si tu développes une nouvelle fonctionnalité, créer un fichier dans `modules/` plutôt que d’alourdir `script.js`.

---

## 📜 Licence

Projet sous licence MIT.

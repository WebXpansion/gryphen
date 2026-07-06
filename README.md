# Gryphen Scroll Sequence Site

Projet Vite prêt pour VS Code + Vercel.

## Lancer en local

```bash
npm install
npm run dev
```

Si `npm install` bloque encore, stoppe avec `Ctrl+C`, puis lance :

```bash
rm -rf node_modules package-lock.json
npm cache verify
npm install --registry=https://registry.npmjs.org/
```

Sur Windows PowerShell :

```powershell
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
npm cache verify
npm install --registry=https://registry.npmjs.org/
```

## Build production

```bash
npm run build
```

## Déploiement Vercel

- Build command : `npm run build`
- Output directory : `dist`
- Framework : Vite

Le fichier `vercel.json` ajoute aussi des headers de sécurité : CSP, Referrer-Policy, Permissions-Policy, X-Content-Type-Options et X-Frame-Options.

## Ce qui est inclus

- Header Gryphen responsive.
- Desktop : `Products`, `Company`, logo centré, `[ Contact us ]` à droite.
- Mobile : hamburger à gauche, logo centré, `[ Contact us ]` à droite.
- Menu mobile accessible avec `aria-expanded`, fermeture au clic externe et touche `Escape`.
- Fond noir global.
- Canvas responsive, max-width `2000px`.
- Séquence `render.mov` extraite en `950` frames JPG dans `public/frames/`.
- UI de debug affichant : frame courant, total frames, progression, range actif.
- Structure JS prête pour ajouter des UI par plages de frames.
- Cache long pour `/frames/*` et `/logo.png` sur Vercel.

## Logo

Le header utilise :

```html
<img src="/logo.png" alt="Gryphen" />
```

Place ton vrai logo dans :

```txt
public/logo.png
```

J’ai inclus un `public/logo.png` de secours basé sur la capture, mais tu peux le remplacer par ton fichier final.

## Ajouter des UI par plages de frames

Dans `src/main.js`, modifie le tableau `FRAME_RANGES` :

```js
const FRAME_RANGES = [
  { id: 'range-10-50', label: 'UI 01 · frames 10–50', start: 10, end: 50 },
  { id: 'range-51-100', label: 'UI 02 · frames 51–100', start: 51, end: 100 }
];
```

À chaque scroll, le projet met aussi à jour :

```js
document.documentElement.dataset.currentFrame
document.documentElement.dataset.activeRange
```

Tu peux donc cibler une UI avec du CSS :

```css
html[data-active-range="range-10-50"] .mon-ui {
  opacity: 1;
}
```

# RICOCHET

**ONE SHOT. INFINITE CHAOS.**

Juego arcade top-down donde todas las balas rebotan en las paredes y obstáculos.
Muévete, apunta, dispara y usa los rebotes para eliminar al rival. React + Vite + Phaser 3.

## Ejecutar en local

```bash
npm install
npm run dev
```

Abre la URL que muestre la terminal (normalmente `http://localhost:5173`).

## Build de producción

```bash
npm run build
npm run preview
```

## Controles

**Jugador 1** — WASD mover · Mouse apuntar · Click izquierdo disparar

**Jugador 2 (Local Multiplayer)** — Flechas mover · J/L rotar apuntado · K disparar

**ESC** — Pausa

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub llamado `ricochet` (si usas otro nombre, actualiza `base` en `vite.config.js`).
2. Sube el proyecto:

```bash
git init
git add .
git commit -m "Ricochet v1.0"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/ricochet.git
git push -u origin main
```

3. En GitHub → **Settings → Pages → Build and deployment → Source**, selecciona **GitHub Actions**.
4. El workflow `.github/workflows/deploy.yml` se ejecutará automáticamente en cada push a `main` y publicará el juego.
5. Tu juego quedará disponible en:

```
https://TU_USUARIO.github.io/ricochet/
```

## Estructura

```
src/
  components/     pantallas de React (menú, HUD, overlays)
  game/
    scenes/       ArenaScene.js — toda la lógica de Phaser
    config/       constantes ajustables (velocidad, vidas, cooldowns...)
    audio.js       SFX generados con Web Audio API (sin archivos externos)
    PhaserGame.jsx puente entre React y Phaser
```

## Ideas para futuras versiones

- Más arenas / selector de mapa
- Power-ups sobre el mapa
- Segundo tipo de arma
- Marcador de mejor de 3 rondas
- Soporte de gamepad

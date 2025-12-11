# Tap n Shoot

Mobile-first, responsive web game built with React and Vite.

## Overview

Tap n Shoot is a 2-player split-screen tap game. A ball sits at the center of a smooth, symmetrical zigzag path. Players tap their side to pull the ball toward their end. The ball follows the path’s curvature precisely and accelerates/decelerates with easing. First to reach the end wins.

## Features

- Split-screen layout with vibrant contrasting colors (top vs bottom)
- Symmetrical zigzag path rendered in SVG with smooth curves
- Precise path following using `SVGPathElement.getPointAtLength`
- requestAnimationFrame-driven 60fps animation
- Easing-based direction changes and natural motion
- Subtle trail effect for visual polish
- Victory overlay with restart
- Responsive design via Flex/Grid and ResizeObserver
- Clean hooks-based implementation and proper cleanup

## Project Structure

- `src/components/` – Game components (`GameBoard`, `VictoryOverlay`)
- `src/utils/` – Helpers (`easing.js`, `useResizeObserver.js`)
- `src/styles/` – CSS styles (`game.css`)
- `public/` – Static assets

## Getting Started

Prerequisites: Node.js 18+

1. Install dependencies:
   `npm install`
2. Start the dev server:
   `npm run dev`
3. Open the preview URL shown in the terminal.

Note: Do not auto-run any Expo tooling; this project uses Vite for web.

## Controls

- Tap/click the top half to pull the ball toward Player 1 (top).
- Tap/click the bottom half to pull the ball toward Player 2 (bottom).
- Tapping smoothly reverses direction from the current position.

## Win & Restart

- The game detects when the ball reaches either end of the path.
- The winning overlay appears; press “Restart” to reset to center.

## Technical Notes

- Path: A responsive, symmetrical zigzag cubic path is generated per container size.
- Animation: rAF loop computes progress along path length; ball position via `getPointAtLength`.
- Easing: Velocity lerps to target using an ease-in-out cubic curve.
- Trail: Recent positions render as fading circles for polish.
- Cleanup: rAF is canceled on unmount; ResizeObserver is disconnected.

## Testing Guide

- Touch/click responsiveness:
  - Verify taps register on both halves on mobile and desktop.
- Path following accuracy:
  - Resize the window; confirm the ball follows the redrawn path smoothly.
- Game state reset:
  - Hit an end, see overlay, press "Restart"; ball returns to center and motion resets.
- Animation smoothness:
  - Test on mid-range devices; confirm consistent motion and trail fading.

## Production

- Build: `npm run build`
- Preview build locally: `npm run preview`

Deploy the contents of `dist/` to your web host or CDN.

import {createEffect, onCleanup, onMount} from 'solid-js';
import {isNight} from '../theme';
import styles from './Background.module.css';

/**
 * Telegram's auth wallpaper, rendered the way tweb does it: a tiny canvas filled
 * with the 4-colour "Telegram gradient" (control points + 1/d⁴ weighting, ported
 * verbatim from components/chat/gradientRenderer.ts), scaled up smoothly, with
 * the doodle pattern (public/assets/img/pattern.svg) tiled on top.
 *
 * Colours come from tweb's src/config/state.ts default themes.
 */

// The 8 animation control points; the static gradient samples every other one.
const POSITIONS = [
  {x: 0.80, y: 0.10}, {x: 0.60, y: 0.20}, {x: 0.35, y: 0.25}, {x: 0.25, y: 0.60},
  {x: 0.20, y: 0.90}, {x: 0.40, y: 0.80}, {x: 0.65, y: 0.75}, {x: 0.75, y: 0.40}
];

type RGB = {r: number; g: number; b: number};
const hex = (n: number): RGB => ({r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255});

// [background_color, second, third, fourth] from state.ts
const DAY_COLORS = [0xdbddbb, 0x6ba587, 0xd5d88d, 0x88b884].map(hex);
const NIGHT_COLORS = [0xfec496, 0xdd6cb9, 0x962fbf, 0x4f5bd5].map(hex);

const W = 64;
const H = 64;

function renderGradient(ctx: CanvasRenderingContext2D, colors: RGB[]) {
  const id = ctx.createImageData(W, H);
  const px = id.data;

  // static phase 0: 4 points at indices 0,2,4,6 with y flipped
  const pts = [0, 1, 2, 3].map((i) => ({
    x: POSITIONS[(i * 2) % POSITIONS.length].x,
    y: 1 - POSITIONS[(i * 2) % POSITIONS.length].y
  }));

  let o = 0;
  for(let y = 0; y < H; ++y) {
    const dpy = y / H;
    const cdy = dpy - 0.5;
    const cdy2 = cdy * cdy;
    for(let x = 0; x < W; ++x) {
      const dpx = x / W;
      const cdx = dpx - 0.5;
      const centerDistance = Math.sqrt(cdx * cdx + cdy2);
      const swirl = 0.35 * centerDistance;
      const theta = swirl * swirl * 0.8 * 8.0;
      const sin = Math.sin(theta);
      const cos = Math.cos(theta);
      const pixelX = Math.max(0, Math.min(1, 0.5 + cdx * cos - cdy * sin));
      const pixelY = Math.max(0, Math.min(1, 0.5 + cdx * sin + cdy * cos));

      let sum = 0, r = 0, g = 0, b = 0;
      for(let i = 0; i < colors.length; ++i) {
        const dx = pixelX - pts[i].x;
        const dy = pixelY - pts[i].y;
        let d = Math.max(0, 0.9 - Math.sqrt(dx * dx + dy * dy));
        d = d * d * d * d;
        sum += d;
        r += d * colors[i].r;
        g += d * colors[i].g;
        b += d * colors[i].b;
      }
      px[o++] = r / sum;
      px[o++] = g / sum;
      px[o++] = b / sum;
      px[o++] = 255;
    }
  }
  ctx.putImageData(id, 0, 0);
}

export default function Background(): JSX.Element {
  let canvas!: HTMLCanvasElement;

  function paint() {
    const ctx = canvas.getContext('2d')!;
    renderGradient(ctx, isNight() ? NIGHT_COLORS : DAY_COLORS);
  }

  onMount(() => {
    canvas.width = W;
    canvas.height = H;
    paint();
    // repaint when the theme flips (class change on <html>)
    const obs = new MutationObserver(() => paint());
    obs.observe(document.documentElement, {attributes: true, attributeFilter: ['class']});
    onCleanup(() => obs.disconnect());
  });

  return (
    <div class={styles.bg}>
      <canvas ref={canvas} class={styles.gradient} />
      <div class={styles.darken} />
      <div class={styles.pattern} />
    </div>
  );
}

import {onCleanup, onMount} from 'solid-js';
import {isNight} from '../theme';
import styles from './Background.module.css';

/**
 * Telegram's auth wallpaper, rendered exactly the way tweb does it
 * (components/chat/bubbles/chatBackground.tsx + gradientRenderer.ts +
 * patternRenderer.ts):
 *
 *  - GRADIENT: a tiny canvas filled with the 4-colour "Telegram gradient"
 *    (control points + 1/d⁴ weighting), scaled up.
 *  - PATTERN: a full-size canvas tiling the doodle SVG.
 *      · day  (intensity +50): drawn normally, mix-blend-mode soft-light @ .5
 *      · night(intensity -50): "mask" mode — fill black then `destination-out`
 *        the doodles, so gaps are black and the doodles reveal the gradient;
 *        the gradient canvas is dimmed to .3.
 *
 * Colours/intensities come from tweb's src/config/state.ts default themes.
 */

const POSITIONS = [
  {x: 0.80, y: 0.10}, {x: 0.60, y: 0.20}, {x: 0.35, y: 0.25}, {x: 0.25, y: 0.60},
  {x: 0.20, y: 0.90}, {x: 0.40, y: 0.80}, {x: 0.65, y: 0.75}, {x: 0.75, y: 0.40}
];
type RGB = {r: number; g: number; b: number};
const hex = (n: number): RGB => ({r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255});
const DAY_COLORS = [0xdbddbb, 0x6ba587, 0xd5d88d, 0x88b884].map(hex);
const NIGHT_COLORS = [0xfec496, 0xdd6cb9, 0x962fbf, 0x4f5bd5].map(hex);
const DAY_INTENSITY = 0.5;
const NIGHT_INTENSITY = -0.5;

const GW = 64;
const GH = 64;
const PATTERN_URL = '/assets/img/pattern.svg';
const PATTERN_W = 1440;
const PATTERN_H = 2960;
// localStorage cache so the doodle SVG survives cmd+shift+r (which bypasses
// HTTP cache). Bumped if the source file changes.
const PATTERN_CACHE_KEY = 'tweb-clone-pattern-svg-v1';

function renderGradient(ctx: CanvasRenderingContext2D, colors: RGB[]) {
  const id = ctx.createImageData(GW, GH);
  const px = id.data;
  const pts = [0, 1, 2, 3].map((i) => ({
    x: POSITIONS[(i * 2) % POSITIONS.length].x,
    y: 1 - POSITIONS[(i * 2) % POSITIONS.length].y
  }));
  let o = 0;
  for(let y = 0; y < GH; ++y) {
    const cdy = y / GH - 0.5;
    const cdy2 = cdy * cdy;
    for(let x = 0; x < GW; ++x) {
      const cdx = x / GW - 0.5;
      const centerDistance = Math.sqrt(cdx * cdx + cdy2);
      const swirl = 0.35 * centerDistance;
      const theta = swirl * swirl * 0.8 * 8.0;
      const sin = Math.sin(theta), cos = Math.cos(theta);
      const pixelX = Math.max(0, Math.min(1, 0.5 + cdx * cos - cdy * sin));
      const pixelY = Math.max(0, Math.min(1, 0.5 + cdx * sin + cdy * cos));
      let sum = 0, r = 0, g = 0, b = 0;
      for(let i = 0; i < colors.length; ++i) {
        const dx = pixelX - pts[i].x, dy = pixelY - pts[i].y;
        let d = Math.max(0, 0.9 - Math.sqrt(dx * dx + dy * dy));
        d = d * d * d * d;
        sum += d;
        r += d * colors[i].r; g += d * colors[i].g; b += d * colors[i].b;
      }
      px[o++] = r / sum; px[o++] = g / sum; px[o++] = b / sum; px[o++] = 255;
    }
  }
  ctx.putImageData(id, 0, 0);
}

// Tile the doodle image into the pattern canvas (ported from patternRenderer.fillCanvas).
function renderPattern(canvas: HTMLCanvasElement, img: HTMLImageElement, mask: boolean) {
  const ctx = canvas.getContext('2d')!;
  const {width, height} = canvas;
  const dpr = Math.min(2, window.devicePixelRatio);
  ctx.clearRect(0, 0, width, height);

  let imageWidth = img.naturalWidth || PATTERN_W;
  let imageHeight = img.naturalHeight || PATTERN_H;
  const patternHeight = (500 + window.innerHeight / 2.5) * dpr;
  const ratio = patternHeight / imageHeight;
  imageWidth *= ratio;
  imageHeight = patternHeight;

  if(mask) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'destination-out';
  } else {
    ctx.globalCompositeOperation = 'source-over';
  }

  const drawRow = (y: number) => {
    for(let x = 0; x < width; x += imageWidth) ctx.drawImage(img, x, y, imageWidth, imageHeight);
  };
  const centerY = (height - imageHeight) / 2;
  drawRow(centerY);
  if(centerY > 0) {
    let topY = centerY;
    do { drawRow(topY -= imageHeight); } while(topY >= 0);
  }
  for(let bottomY = centerY + imageHeight; bottomY < height - 1; bottomY += imageHeight) drawRow(bottomY);
  ctx.globalCompositeOperation = 'source-over';
}

export default function Background() {
  let gradientCanvas!: HTMLCanvasElement;
  let patternCanvas!: HTMLCanvasElement;
  let patternImg: HTMLImageElement | undefined;

  function sizePatternCanvas() {
    const dpr = Math.min(2, window.devicePixelRatio);
    // Viewport-sized, exactly like tweb's pattern layer — the tiling is anchored
    // to the viewport's left edge and vertically centred (see renderPattern), so
    // the doodle phase matches web.telegram.org/k at the same window size.
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;
    patternCanvas.width = Math.ceil(cssW * dpr);
    patternCanvas.height = Math.ceil(cssH * dpr);
    patternCanvas.style.width = cssW + 'px';
    patternCanvas.style.height = cssH + 'px';
  }

  function paint() {
    const night = isNight();
    renderGradient(gradientCanvas.getContext('2d')!, night ? NIGHT_COLORS : DAY_COLORS);
    const intensity = night ? NIGHT_INTENSITY : DAY_INTENSITY;
    const isDark = intensity < 0;

    if(patternImg) renderPattern(patternCanvas, patternImg, isDark);

    // opacity assignment mirrors buildContent():
    //  - dark (mask): dim the GRADIENT; pattern (black-with-holes) stays full
    //  - light (blend): dim the PATTERN; gradient stays full
    if(isDark) {
      const gOpacity = Math.max(0.3, Math.abs(intensity) * 0.5);
      gradientCanvas.style.opacity = '' + gOpacity;
      patternCanvas.style.opacity = '1';
      patternCanvas.style.mixBlendMode = 'normal';
    } else {
      gradientCanvas.style.opacity = '1';
      patternCanvas.style.opacity = '' + Math.abs(intensity);
      patternCanvas.style.mixBlendMode = 'soft-light';
    }
  }

  onMount(() => {
    gradientCanvas.width = GW;
    gradientCanvas.height = GH;
    sizePatternCanvas();

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { patternImg = img; paint(); };

    // Try localStorage first — surviving hard refresh. Fall back to network
    // and then warm the cache for next time.
    let cached: string | null = null;
    try { cached = localStorage.getItem(PATTERN_CACHE_KEY); } catch {/* private mode */}
    if(cached) {
      const blobUrl = URL.createObjectURL(new Blob([cached], {type: 'image/svg+xml'}));
      img.src = blobUrl;
      onCleanup(() => URL.revokeObjectURL(blobUrl));
    } else {
      img.src = PATTERN_URL;
      fetch(PATTERN_URL)
        .then((r) => r.ok ? r.text() : null)
        .then((text) => {
          if(!text) return;
          try { localStorage.setItem(PATTERN_CACHE_KEY, text); } catch {/* quota */}
        })
        .catch(() => {/* ignore */});
    }

    paint();

    const obs = new MutationObserver(() => paint());
    obs.observe(document.documentElement, {attributes: true, attributeFilter: ['class']});

    // Re-tile on resize, exactly like tweb's pattern layer.
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { sizePatternCanvas(); paint(); });
    };
    window.addEventListener('resize', onResize);

    onCleanup(() => {
      obs.disconnect();
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    });
  });

  return (
    <div class={styles.bg}>
      <canvas ref={gradientCanvas} class={styles.gradient} />
      <canvas ref={patternCanvas} class={styles.pattern} />
    </div>
  );
}

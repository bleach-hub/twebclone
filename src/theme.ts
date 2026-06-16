/**
 * Theme switching with the Telegram circular reveal (ported from tweb's
 * themeController.setTheme). Uses the View Transitions API: a circle clipped at
 * the click point grows to cover the screen, revealing the new theme underneath.
 *
 * Falls back to an instant toggle where startViewTransition is unavailable.
 */

export function isNight(): boolean {
  return document.documentElement.classList.contains('night');
}

const STORAGE_KEY = 'tweb-clone-theme';

function applyTheme(night: boolean) {
  document.documentElement.classList.toggle('night', night);
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute('content', night ? '#212121' : '#ffffff');
  try { localStorage.setItem(STORAGE_KEY, night ? 'night' : 'day'); } catch {}
}

// Track OS theme changes — apply automatically when the user hasn't made an
// explicit choice in this app.
if(typeof window !== 'undefined' && window.matchMedia) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener?.('change', (e) => {
    let stored: string | null = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch {}
    if(stored) return; // user picked manually — leave it
    document.documentElement.classList.toggle('night', e.matches);
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', e.matches ? '#212121' : '#ffffff');
  });
}

export function toggleTheme(coords?: {x: number; y: number}) {
  const goingNight = !isNight();

  // No View Transitions support, reduced motion, or no coords → instant.
  const supported = 'startViewTransition' in document;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!supported || reduceMotion || !coords) {
    applyTheme(goingNight);
    return;
  }

  // `reverse` mirrors tweb: when going back to light we animate the OLD (dark)
  // layer shrinking away instead of the new one growing.
  const reverse = !goingNight; // going to light => reverse
  document.documentElement.classList.add('no-view-transition');
  document.documentElement.classList.toggle('reverse', reverse);

  // @ts-ignore - View Transitions API
  const transition = document.startViewTransition(() => {
    applyTheme(goingNight);
  });

  transition.ready.then(() => {
    const {x, y} = coords;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const clip = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`
    ];

    document.documentElement.animate(
      {clipPath: reverse ? [...clip].reverse() : clip},
      {
        duration: 500,
        easing: 'ease-in-out',
        pseudoElement: `::view-transition-${reverse ? 'old' : 'new'}(root)`,
        fill: 'forwards'
      }
    );
  });

  transition.finished.finally(() => {
    document.documentElement.classList.remove('no-view-transition', 'reverse');
  });
}

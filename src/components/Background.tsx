import {JSX} from 'solid-js';
import styles from './Background.module.css';

/**
 * Telegram's auth-screen wallpaper: a 4-colour gradient with the bundled doodle
 * pattern (public/assets/img/pattern.svg) tiled over it.
 *
 * Colours come straight from tweb's src/config/state.ts default themes:
 *  - day   gradient: #dbddbb #6ba587 #d5d88d #88b884  (intensity +50 → dark doodles)
 *  - night gradient: #fec496 #dd6cb9 #962fbf #4f5bd5  (intensity -50 → bright doodles on black)
 *
 * The pattern SVG is black-on-transparent, so we use it as a CSS mask: the
 * masked layer's colour only shows through the doodle shapes.
 *  - day:   mask a translucent dark layer → doodles read slightly darker than the gradient.
 *  - night: black base, mask the bright gradient → doodles glow faintly over near-black.
 */
export default function Background(): JSX.Element {
  return (
    <div class={styles.bg}>
      <div class={styles.gradient} />
      <div class={styles.pattern} />
    </div>
  );
}

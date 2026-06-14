import {JSX} from 'solid-js';
import styles from '../authFlow.module.css';

/** Telegram paper-plane logo. */
export function TelegramLogo(): JSX.Element {
  return (
    <svg class={styles.logo} viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
      {/* circle uses the theme primary color (blue in day, purple in night) */}
      <circle cx="120" cy="120" r="120" fill="var(--primary-color)" />
      <path
        fill="#fff"
        d="M53 118.5c35-15.2 58.3-25.3 70-30.2 33.3-13.9 40.2-16.3 44.7-16.4 1 0 3.2.2 4.7 1.4.5.4.6 1 .7 1.7.1.5.2 1.7.1 2.6-1.1 11.6-5.9 39.6-8.3 52.6-1 5.5-3 7.3-4.9 7.5-4.2.4-7.3-2.8-11.4-5.4-6.4-4.2-10-6.8-16.2-10.9-7.2-4.7-2.5-7.3 1.6-11.5 1.1-1.1 19.6-18 20-19.5.1-.2.1-1-.4-1.4-.4-.4-1.1-.3-1.6-.1-.7.1-11.6 7.4-32.8 21.7-3.1 2.1-5.9 3.2-8.5 3.1-2.8-.1-8.2-1.6-12.2-2.9-4.9-1.6-8.8-2.4-8.4-5.1.2-1.4 2.1-2.8 5.6-4.3z"
      />
    </svg>
  );
}

import {JSX, Match, Switch} from 'solid-js';
import {AuthFlowContext, AuthFlowContextValue, currentCard, navigateAuth} from './authFlow';
import SignInCard from './cards/SignInCard';
import AuthCodeCard from './cards/AuthCodeCard';
import PasswordCard from './cards/PasswordCard';
import SignUpCard from './cards/SignUpCard';
import Background from './components/Background';
import {DarkModeIcon} from './components/DarkModeIcon';
import {toggleTheme} from './theme';
import styles from './authFlow.module.css';

/**
 * Top-level auth host (port of AuthCardsHost.tsx). Renders the theme toggle,
 * a centered scrollable column, and the current card.
 */
export default function AuthCardsHost(): JSX.Element {
  const ctx: AuthFlowContextValue = {
    current: currentCard,
    navigate: navigateAuth,
    toIm: (meta) => {
      // Success! In the real app this bootstraps the chat list. Here we just
      // show a simple "logged in" screen. Change this however you like.
      const name = meta?.name;
      document.getElementById('root')!.innerHTML =
        `<div class="${styles.loggedIn}">` +
        `<div class="${styles.checkmark}">✓</div>` +
        `<h2>Welcome${name ? ', ' + escapeHtml(name) : ' back'}!</h2>` +
        `<p>You are now logged in. (mock)</p>` +
        `<button onclick="location.reload()">Start over</button>` +
        `</div>`;
    }
  };

  function onToggleTheme(e: MouseEvent) {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    toggleTheme({x: rect.left + rect.width / 2, y: rect.top + rect.height / 2});
  }

  return (
    <AuthFlowContext.Provider value={ctx}>
      <Background />
      <div class={styles.host} id="auth-pages">
        <button class={styles.themeButton} onClick={onToggleTheme} title="Toggle theme">
          <DarkModeIcon size={22} />
        </button>
        <div class={styles.scrollable}>
          <div class={styles.placeholderTop} />
          <div class={styles.cardsContainer}>
            <Switch>
              <Match when={currentCard().name === 'signIn'}>
                <SignInCard />
              </Match>
              <Match when={currentCard().name === 'authCode'}>
                <AuthCodeCard spec={currentCard() as any} />
              </Match>
              <Match when={currentCard().name === 'password'}>
                <PasswordCard spec={currentCard() as any} />
              </Match>
              <Match when={currentCard().name === 'signUp'}>
                <SignUpCard spec={currentCard() as any} />
              </Match>
            </Switch>
          </div>
          <div class={styles.placeholder} />
        </div>
      </div>
    </AuthFlowContext.Provider>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]!)
  );
}

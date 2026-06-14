# tweb-login-clone

A standalone recreation of the **Telegram Web K** ([tweb](https://github.com/morethanwords/tweb))
login flow, built with **Solid.js + Vite**. There are **no network requests** —
every "API call" is resolved by a local mock.

## Run

```bash
npm install
npm run dev      # opens http://localhost:5173
```

## Flow

`SignIn` (phone) → `AuthCode` (5-digit) → either straight to the logged-in
screen, or `Password` (cloud 2FA) → logged in. `SignUp` exists for numbers
flagged as new accounts.

## Test credentials (default)

| Phone            | Code    | Cloud password | Result                       |
| ---------------- | ------- | -------------- | ---------------------------- |
| `+888 0123 0123` | `11488` | —              | logs in directly             |
| `+888 0456 0456` | `11488` | `123456goth`   | asks for the cloud password  |

## Change anything

Everything you'd want to tweak lives in **`src/mockAuth.ts`**:

- `ACCOUNTS` — test phone numbers, their passwords, hints, and whether a number
  goes to Sign Up.
- `DEFAULT_CODE` — the accepted login code (`CODE_LENGTH` follows it).
- `FAKE_DELAY` — fake latency so the spinners are visible (set `0` to disable).
- `sendCode` / `signInWithCode` / `checkPassword` / `signUp` — the actual logic
  behind each button. Edit these to change what happens on "Next" / "Log in".

What happens **on success** (currently a "logged in" screen) is the `toIm`
callback in `src/AuthCardsHost.tsx` — change it there.

## Faithful details ported from tweb

- **Country selector** with the full country list (flags + dial codes), live
  filtering, and the chevron/drop-down animation. Two-way synced with the phone
  field (pick a country → prefix fills; type a code → country follows), and the
  number is formatted by the country's pattern with a dim `—— ——— ————` hint.
- **Doodle wallpaper** — the real `pattern.svg` masked over Telegram's 4-colour
  gradients (green for day, peach→pink→purple for night), from `config/state.ts`.
- **Circular theme switch** — the View Transitions API circular clip-path reveal
  from the toggle button, ported from `themeController.setTheme`.
- **Real Lottie monkeys** — the actual `TwoFactorSetupMonkey*` animations via
  lottie-web: the tracking monkey follows the code digits, the password monkey
  covers/uncovers its eyes.
- **Dark-mode icon** — the genuine tgico "darkmode" glyph (crescent + sparkles).

## Structure

```
src/
  index.tsx              entry
  authFlow.ts            card router + shared context (port of tweb authFlow.tsx)
  AuthCard.tsx           card scaffold
  AuthCardsHost.tsx      host shell, background, theme toggle, success screen
  theme.ts               View Transitions circular theme switch
  mockAuth.ts            >>> the mock backend — edit this <<<
  cards/
    SignInCard.tsx       phone entry + country selector
    AuthCodeCard.tsx     code entry
    PasswordCard.tsx     cloud password
    SignUpCard.tsx       new-account name entry
  components/
    Logo.tsx             Telegram logo (follows the theme primary colour)
    CountrySelect.tsx    country picker dropdown
    Background.tsx       doodle pattern + gradient wallpaper
    Monkey.tsx           real Lottie tracking/password monkeys
    DarkModeIcon.tsx     tgico darkmode glyph
  data/
    countries.ts/json    country list + phone formatting
  global.css             theme tokens (day/night) + form primitives
  authFlow.module.css    auth flow layout (port of authFlow.module.scss)
public/assets/
  img/pattern.svg        doodle wallpaper
  tgs/*.json             Lottie monkey animations
```

Click the moon button (top-right) to toggle the day/night theme — it reveals
with the circular wipe from the button.

## Credits

UI, assets (`pattern.svg`, monkey Lottie files, country data) and behaviour are
derived from [morethanwords/tweb](https://github.com/morethanwords/tweb)
(Telegram Web K), GPLv3. This is a non-functional mock for learning purposes.

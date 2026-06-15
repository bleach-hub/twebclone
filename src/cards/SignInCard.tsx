import {createSignal, JSX, onMount} from 'solid-js';
import AuthCard from '../AuthCard';
import {useAuthFlow} from '../authFlow';
import {sendCode} from '../mockAuth';
import {TelegramLogo} from '../components/Logo';
import CountrySelect from '../components/CountrySelect';
import {
  COUNTRY_ROWS,
  CountryRow,
  matchCountryByDigits,
  formatPhone
} from '../data/countries';
import {AUTH_CONFIG} from '../config';
import styles from '../authFlow.module.css';

const DEFAULT_ISO2 = 'AL'; // Albania, matching the reference screenshots

/**
 * Phone-number entry (port of SignInCard.tsx) with the country selector.
 * Country picker ⇄ phone field are two-way synced:
 *  - pick a country → phone field resets to "+code "
 *  - type a country code in the phone field → country selector follows
 * The phone number is formatted by the country's pattern (X = digit).
 */
export default function SignInCard(): JSX.Element {
  const {navigate} = useAuthFlow();

  const initial = COUNTRY_ROWS.find((r) => r.country.iso2 === DEFAULT_ISO2);

  const [countryName, setCountryName] = createSignal(initial?.country.default_name ?? '');
  const [selected, setSelected] = createSignal<CountryRow | undefined>(initial);
  const [phone, setPhone] = createSignal(initial ? '+' + initial.code.country_code : '+');
  const [submitting, setSubmitting] = createSignal(false);
  const [error, setError] = createSignal('');

  let phoneEl!: HTMLInputElement;

  /**
   * Dim trailing placeholder (the "leftPattern" in tweb). Build the full template
   * "+CC NN NNN NNNN" with unfilled positions as U+2012 figure dashes, then return
   * everything after the already-typed value so typed + rest === full template.
   * This guarantees the dim dashes line up exactly after the entered digits.
   */
  const placeholderPattern = () => {
    const sel = selected();
    const pat = sel?.code.patterns?.[0];
    if(!pat) return '';
    const national = digits().slice(sel!.code.country_code.length);
    let full = '+' + sel!.code.country_code + ' ';
    let di = 0;
    for(const ch of pat) {
      if(ch === 'X') full += di < national.length ? national[di++] : '‒';
      else full += ch;
    }
    return full.slice(phone().length);
  };

  const digits = () => phone().replace(/\D/g, '');
  const hasValidInput = () => digits().length > 4;

  function onCountrySelect(row: CountryRow) {
    setSelected(row);
    setCountryName(row.country.default_name);
    setPhone('+' + row.code.country_code);
    setError('');
    queueMicrotask(() => phoneEl?.focus());
  }

  function onPhoneInput(e: InputEvent & {currentTarget: HTMLInputElement}) {
    const raw = e.currentTarget.value;
    let d = raw.replace(/\D/g, '');
    setError('');

    if(!d) {
      setPhone('+');
      setSelected(undefined);
      setCountryName('');
      return;
    }

    // Detect country from the leading digits.
    const match = matchCountryByDigits(d);
    if(match) {
      setSelected(match);
      setCountryName(match.country.default_name);
      const national = d.slice(match.code.country_code.length);
      setPhone(formatPhone(match.code.country_code, national, match.code.patterns?.[0]));
    } else {
      setSelected(undefined);
      setCountryName('');
      setPhone('+' + d);
    }
  }

  function onPhoneKeyDown(e: KeyboardEvent) {
    // allow only digits, +, and control keys
    const allowed = e.key.length > 1 || e.key === '+' || /\d/.test(e.key) || e.metaKey || e.ctrlKey;
    if(!allowed) e.preventDefault();
    if(e.key === 'Enter' && hasValidInput() && !submitting()) onSubmit();
  }

  function onSubmit(e?: Event) {
    e?.preventDefault();
    if(!hasValidInput() || submitting()) return;
    setSubmitting(true);
    setError('');
    sendCode(phone())
      .then((sentCode) => navigate({name: 'authCode', payload: sentCode}))
      .catch((err) => {
        setSubmitting(false);
        setError(err.type === 'PHONE_NUMBER_INVALID' ? 'Invalid phone number' : err.type);
      });
  }

  onMount(() => phoneEl?.focus());

  return (
    <AuthCard
      class={styles.pageSignIn}
      header={
        <div class={styles.mediaHeader}>
          <div class={styles.logoContainer}>
            <TelegramLogo />
          </div>
          <h4 class={styles.title}>Sign in to Telegram</h4>
          <div class={`${styles.subtitle} secondary`}>
            Please confirm your country code and enter your phone number.
          </div>
        </div>
      }
      inputWrapper={false}
    >
      <form class="input-wrapper" onSubmit={onSubmit}>
        <CountrySelect value={countryName()} onSelect={onCountrySelect} />

        <div class={`input-field ${styles.phoneField} ${error() ? 'error' : ''}`}>
          <input
            ref={phoneEl}
            class="input-field-input"
            type="tel"
            inputmode="tel"
            value={phone()}
            onInput={onPhoneInput as any}
            onKeyDown={onPhoneKeyDown}
            placeholder=" "
          />
          {/* dim trailing pattern, aligned right after the typed value */}
          <div class={styles.phoneGhost} aria-hidden="true">
            <span class={styles.phoneGhostTyped}>{phone()}</span>
            <span class={styles.phoneGhostRest}>{placeholderPattern()}</span>
          </div>
          <label>{error() || 'Phone Number'}</label>
        </div>

        <button
          type="submit"
          class="btn-primary btn-color-primary"
          disabled={!hasValidInput() || submitting()}
        >
          {submitting() ? 'Please wait' : 'Next'}
          {submitting() && <span class={styles.spinner} />}
        </button>
      </form>
      {AUTH_CONFIG.showQrLogin && (
        <button
          type="button"
          class="btn-primary btn-secondary btn-primary-transparent"
          disabled={submitting()}
          onClick={() => {/* TODO: navigate({name: 'signQR'}) once card exists */}}
        >
          Log in by QR Code &gt;
        </button>
      )}
      {AUTH_CONFIG.showPasskeyLogin && (
        <button
          type="button"
          class="btn-primary btn-secondary btn-primary-transparent"
          disabled={submitting()}
          onClick={() => {/* TODO: passkey login */}}
        >
          Log in by passkey &gt;
        </button>
      )}
    </AuthCard>
  );
}

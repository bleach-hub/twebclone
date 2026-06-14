import {createSignal, JSX, onMount} from 'solid-js';
import AuthCard from '../AuthCard';
import {useAuthFlow, CardSpec} from '../authFlow';
import {checkPassword, passwordHint} from '../mockAuth';
import {PasswordMonkey} from '../components/Monkey';
import styles from '../authFlow.module.css';

type Spec = Extract<CardSpec, {name: 'password'}>;

/**
 * Cloud password / 2FA (port of PasswordCard.tsx). The monkey covers its eyes
 * while the password is hidden and peeks when revealed.
 */
export default function PasswordCard(props: {spec: Spec}): JSX.Element {
  const {toIm} = useAuthFlow();
  const phone = props.spec.payload.phone_number;
  const hint = passwordHint(phone);

  const [value, setValue] = createSignal('');
  const [reveal, setReveal] = createSignal(false);
  const [submitting, setSubmitting] = createSignal(false);
  const [error, setError] = createSignal('');

  let inputEl!: HTMLInputElement;

  function onSubmit(e?: Event) {
    e?.preventDefault();
    if(!value().length) {
      setError('Please enter your password');
      return;
    }
    setSubmitting(true);
    setError('');

    checkPassword(phone, value())
      .then(() => toIm())
      .catch((err) => {
        setSubmitting(false);
        setError(err.type === 'PASSWORD_HASH_INVALID' ? 'Invalid password' : err.type);
        inputEl?.select();
      });
  }

  onMount(() => inputEl?.focus());

  return (
    <AuthCard
      class={styles.pagePassword}
      header={
        <div class={styles.mediaHeader}>
          <PasswordMonkey reveal={reveal()} />
          <h4 class={styles.title}>Enter Your Password</h4>
          <div class={`${styles.subtitle} secondary`}>
            Your account is protected with an additional password.
          </div>
        </div>
      }
    >
      <form onSubmit={onSubmit} style={{display: 'contents'}}>
        <div class={`input-field ${error() ? 'error' : ''}`}>
          <input
            ref={inputEl}
            class="input-field-input"
            type={reveal() ? 'text' : 'password'}
            value={value()}
            onInput={(e) => {
              setValue(e.currentTarget.value);
              setError('');
            }}
            placeholder=" "
          />
          <label>{error() || hint || 'Password'}</label>
          <span class={styles.revealToggle} onClick={() => setReveal(!reveal())} title="Show password">
            {reveal() ? '🙈' : '👁'}
          </span>
        </div>
        <button type="submit" class="btn-primary btn-color-primary" disabled={submitting()}>
          {submitting() ? 'Please wait' : 'Next'}
          {submitting() && <span class={styles.spinner} />}
        </button>
      </form>
    </AuthCard>
  );
}

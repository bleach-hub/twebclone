import {createSignal, JSX, onMount} from 'solid-js';
import AuthCard from '../AuthCard';
import {useAuthFlow, CardSpec} from '../authFlow';
import {signUp} from '../mockAuth';
import styles from '../authFlow.module.css';

type Spec = Extract<CardSpec, {name: 'signUp'}>;

/**
 * New-account registration (port of SignUpCard.tsx). Name entry → signUp() → IM.
 * Only reached for numbers flagged needsSignUp in mockAuth.ts.
 */
export default function SignUpCard(props: {spec: Spec}): JSX.Element {
  const {toIm} = useAuthFlow();
  const phone = props.spec.payload.phone_number;

  const [first, setFirst] = createSignal('');
  const [last, setLast] = createSignal('');
  const [submitting, setSubmitting] = createSignal(false);
  const [error, setError] = createSignal('');

  let firstEl!: HTMLInputElement;

  function onSubmit(e?: Event) {
    e?.preventDefault();
    if(!first().trim()) {
      setError('Please enter your name');
      return;
    }
    setSubmitting(true);
    setError('');
    signUp(phone, first())
      .then((res) => toIm({name: res.name}))
      .catch(() => {
        setSubmitting(false);
        setError('Invalid name');
      });
  }

  onMount(() => firstEl?.focus());

  return (
    <AuthCard
      class={styles.pageSignUp}
      header={
        <div class={styles.mediaHeader}>
          <div class={styles.avatarPlaceholder}>+</div>
          <h4 class={styles.title}>Your Name</h4>
          <div class={`${styles.subtitle} secondary`}>
            Enter your name and add a profile picture.
          </div>
        </div>
      }
    >
      <form onSubmit={onSubmit} style={{display: 'contents'}}>
        <div class={`input-field ${error() ? 'error' : ''}`}>
          <input
            ref={firstEl}
            class="input-field-input"
            type="text"
            value={first()}
            onInput={(e) => {
              setFirst(e.currentTarget.value);
              setError('');
            }}
            placeholder=" "
          />
          <label>{error() || 'Name'}</label>
        </div>
        <div class="input-field">
          <input
            class="input-field-input"
            type="text"
            value={last()}
            onInput={(e) => setLast(e.currentTarget.value)}
            placeholder=" "
          />
          <label>Last Name (optional)</label>
        </div>
        <button type="submit" class="btn-primary btn-color-primary" disabled={submitting()}>
          {submitting() ? 'Please wait' : 'Start Messaging'}
          {submitting() && <span class={styles.spinner} />}
        </button>
      </form>
    </AuthCard>
  );
}

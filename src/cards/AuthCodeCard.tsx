import {createSignal, For, JSX, onMount} from 'solid-js';
import AuthCard from '../AuthCard';
import {useAuthFlow, CardSpec} from '../authFlow';
import {signInWithCode, SentCode} from '../mockAuth';
import {TrackingMonkey} from '../components/Monkey';
import styles from '../authFlow.module.css';

type Spec = Extract<CardSpec, {name: 'authCode'}>;

/**
 * Code entry (port of AuthCodeCard.tsx). N separate digit boxes; auto-submits
 * when full. signInWithCode() → IM / password / signUp.
 */
export default function AuthCodeCard(props: {spec: Spec}): JSX.Element {
  const {navigate, toIm} = useAuthFlow();
  const sentCode: SentCode = props.spec.payload;

  const [digits, setDigits] = createSignal<string[]>(Array(sentCode.length).fill(''));
  const [error, setError] = createSignal('');
  const [disabled, setDisabled] = createSignal(false);
  // Drives the monkey's "covering eyes" pose: how many boxes are filled.
  const filledCount = () => digits().filter(Boolean).length;

  let inputs: HTMLInputElement[] = [];

  function setDigit(i: number, val: string) {
    const next = [...digits()];
    next[i] = val;
    setDigits(next);
    setError('');

    const code = next.join('');
    if(code.length === sentCode.length && next.every(Boolean)) {
      submit(code);
    }
  }

  function onInput(i: number, e: InputEvent & {currentTarget: HTMLInputElement}) {
    const raw = e.currentTarget.value.replace(/\D/g, '');
    if(!raw) {
      setDigit(i, '');
      return;
    }
    // Support paste of the whole code into one box.
    if(raw.length > 1) {
      const chars = raw.slice(0, sentCode.length).split('');
      const next = [...digits()];
      chars.forEach((c, k) => (next[Math.min(i + k, sentCode.length - 1)] = c));
      setDigits(next);
      const last = Math.min(i + chars.length, sentCode.length - 1);
      inputs[last]?.focus();
      const code = next.join('');
      if(code.length === sentCode.length && next.every(Boolean)) submit(code);
      return;
    }
    e.currentTarget.value = raw;
    setDigit(i, raw);
    if(i < sentCode.length - 1) inputs[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: KeyboardEvent) {
    if(e.key === 'Backspace' && !digits()[i] && i > 0) {
      inputs[i - 1]?.focus();
    }
  }

  function submit(code: string) {
    setDisabled(true);
    signInWithCode(sentCode.phone_number, code)
      .then((res) => {
        switch(res._) {
          case 'authorization':
            toIm();
            break;
          case 'passwordNeeded':
            navigate({name: 'password', payload: {phone_number: sentCode.phone_number}});
            break;
          case 'signUpRequired':
            navigate({name: 'signUp', payload: {phone_number: sentCode.phone_number}});
            break;
        }
      })
      .catch((err) => {
        setError(err.type === 'PHONE_CODE_INVALID' ? 'Invalid code' : err.type);
        setDigits(Array(sentCode.length).fill(''));
        setDisabled(false);
        inputs[0]?.focus();
        inputs.forEach((el) => (el.value = ''));
      });
  }

  onMount(() => inputs[0]?.focus());

  return (
    <AuthCard
      class={styles.pageAuthCode}
      header={
        <div class={styles.mediaHeader}>
          <TrackingMonkey filled={filledCount()} total={sentCode.length} />
          <h4 class={`${styles.title} ${styles.phoneWrapper}`}>
            {sentCode.phone_number}
            <span class={styles.phoneEdit} title="Edit" onClick={() => navigate({name: 'signIn'})}>
              ✎
            </span>
          </h4>
          <div class={`${styles.subtitle} secondary`}>
            We've sent you a message with the code.
          </div>
        </div>
      }
      inputWrapper={false}
    >
      <div class={styles.codeInputField} classList={{[styles.codeError]: !!error()}}>
        <For each={digits()}>
          {(d, i) => (
            <input
              ref={(el) => (inputs[i()] = el)}
              class={styles.codeBox}
              type="tel"
              inputmode="numeric"
              maxlength="1"
              value={d}
              disabled={disabled()}
              onInput={(e) => onInput(i(), e as any)}
              onKeyDown={(e) => onKeyDown(i(), e)}
            />
          )}
        </For>
      </div>
      <div class={styles.errorLabel}>{error()}</div>
    </AuthCard>
  );
}

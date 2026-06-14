import {JSX, Show} from 'solid-js';
import styles from './authFlow.module.css';

/**
 * Reusable card scaffold (port of tweb's AuthCard.tsx). Rounded surface with a
 * header (sticker/title/subtitle) above an optional .input-wrapper.
 */
export type AuthCardProps = {
  class?: string;
  header?: JSX.Element;
  inputWrapper?: boolean;
  children?: JSX.Element;
};

export default function AuthCard(props: AuthCardProps): JSX.Element {
  const useInputWrapper = () => props.inputWrapper !== false;
  return (
    <div class={`${styles.card} ${props.class ?? ''}`}>
      {props.header}
      <Show when={useInputWrapper()} fallback={props.children}>
        <div class="input-wrapper">{props.children}</div>
      </Show>
    </div>
  );
}

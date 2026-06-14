import {Accessor, createContext, createSignal, useContext} from 'solid-js';
import type {SentCode} from './mockAuth';

/**
 * Centralised auth-flow router & shared context — a trimmed port of tweb's
 * src/pages/authFlow.tsx. One card is shown at a time; cards navigate by
 * calling useAuthFlow().navigate({name, payload}).
 */

export type CardName = 'signIn' | 'authCode' | 'password' | 'signUp';

export type CardPayloadMap = {
  signIn: void;
  authCode: SentCode;
  password: {phone_number: string};
  signUp: {phone_number: string};
};

export type CardSpec = {
  [K in CardName]: CardPayloadMap[K] extends void
    ? {name: K}
    : {name: K; payload: CardPayloadMap[K]};
}[CardName];

const [currentCard, setCurrentCard] = createSignal<CardSpec>({name: 'signIn'});

export {currentCard};

export function navigateAuth(spec: CardSpec): void {
  setCurrentCard(spec);
}

export type AuthFlowContextValue = {
  current: Accessor<CardSpec>;
  navigate(spec: CardSpec): void;
  /** Called on a successful login — replace with whatever you want. */
  toIm(meta?: {name?: string}): void;
};

export const AuthFlowContext = createContext<AuthFlowContextValue>();

export function useAuthFlow(): AuthFlowContextValue {
  const ctx = useContext(AuthFlowContext);
  if(!ctx) throw new Error('useAuthFlow() called outside of <AuthFlowProvider>');
  return ctx;
}

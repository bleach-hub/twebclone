/**
 * ============================================================================
 *  MOCK BACKEND — this is the ONE file you edit to change login behaviour.
 * ============================================================================
 *
 *  There are NO network requests anywhere in this project. Every "API call"
 *  the cards make is resolved here, synchronously-ish (wrapped in a small
 *  fake delay so the preloaders are visible).
 *
 *  Want to change what happens on "Next" / "Log in"? Edit the functions below.
 *  Want a different test number, code, or password? Edit ACCOUNTS / DEFAULT_CODE.
 */

export type MockAccount = {
  /** Phone number in the exact format the user will type, e.g. '+888 0123 0123'. */
  phone: string;
  /** Cloud password (2FA). Leave undefined/empty for "no cloud password". */
  password?: string;
  /** Password hint shown on the password card. Optional. */
  passwordHint?: string;
  /** If true, this number has no account yet → after the code, go to Sign Up. */
  needsSignUp?: boolean;
};

/* -------------------------------------------------------------------------- */
/*  EDIT ME: the accounts your fake Telegram knows about.                     */
/* -------------------------------------------------------------------------- */

export const ACCOUNTS: MockAccount[] = [
  {
    phone: '+888 0123 0123'
    // no password → goes straight to IM after the code
  },
  {
    phone: '+888 0456 0456',
    password: '123456goth',
    passwordHint: 'goth'
  }
];

/** The login code accepted for every number. */
export const DEFAULT_CODE = '11488';

/** How many digits the code input expects (keep in sync with DEFAULT_CODE). */
export const CODE_LENGTH = DEFAULT_CODE.length;

/** Fake network latency in ms, so the spinners are visible. Set to 0 to disable. */
export const FAKE_DELAY = 600;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const norm = (phone: string) => phone.replace(/\D/g, '');

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), FAKE_DELAY));
}

/** Reject with a Telegram-style error object: {type: 'PHONE_NUMBER_INVALID'}. */
function fail(type: string): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject({type}), FAKE_DELAY));
}

export function findAccount(phone: string): MockAccount | undefined {
  const n = norm(phone);
  return ACCOUNTS.find((a) => norm(a.phone) === n);
}

/* -------------------------------------------------------------------------- */
/*  "API" — mirrors the real tweb manager calls the cards used to make.        */
/* -------------------------------------------------------------------------- */

export type SentCode = {
  phone_number: string;
  phone_code_hash: string;
  length: number;
};

/** SignInCard → "Next". Real call: auth.sendCode. */
export function sendCode(phone_number: string): Promise<SentCode> {
  // Any +888 ... number (or any known account) is accepted. Tweak this rule
  // however you like — e.g. only allow known accounts:
  //   if(!findAccount(phone_number)) return fail('PHONE_NUMBER_INVALID');
  const digits = norm(phone_number);
  if(digits.length < 6) return fail('PHONE_NUMBER_INVALID');

  return delay({
    phone_number,
    phone_code_hash: 'mock-hash',
    length: CODE_LENGTH
  });
}

export type SignInResult =
  | {_: 'authorization'}
  | {_: 'signUpRequired'}
  | {_: 'passwordNeeded'};

/** AuthCodeCard → on code filled. Real call: auth.signIn. */
export function signInWithCode(phone_number: string, code: string): Promise<SignInResult> {
  if(code !== DEFAULT_CODE) return fail('PHONE_CODE_INVALID');

  const account = findAccount(phone_number);

  if(account?.password) return delay<SignInResult>({_: 'passwordNeeded'});
  if(account?.needsSignUp) return delay<SignInResult>({_: 'signUpRequired'});
  return delay<SignInResult>({_: 'authorization'});
}

/** PasswordCard → "Log in". Real call: auth.checkPassword. */
export function checkPassword(phone_number: string, password: string): Promise<{_: 'authorization'}> {
  const account = findAccount(phone_number);
  if(account && account.password === password) {
    return delay({_: 'authorization' as const});
  }
  return fail('PASSWORD_HASH_INVALID');
}

/** PasswordCard hint lookup (shown as the input label). */
export function passwordHint(phone_number: string): string | undefined {
  return findAccount(phone_number)?.passwordHint;
}

/** SignUpCard → "Start Messaging". Real call: auth.signUp. */
export function signUp(_phone: string, firstName: string): Promise<{_: 'authorization'; name: string}> {
  if(!firstName.trim()) return fail('FIRSTNAME_INVALID');
  return delay({_: 'authorization' as const, name: firstName});
}

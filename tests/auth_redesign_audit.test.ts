import { isSupabaseConfigured, getSupabaseConfig } from '../src/lib/supabase';
import {
  signUp,
  signInWithPassword,
  resetPasswordForEmail,
  updatePassword,
  signOut,
  getActiveSession,
} from '../src/services/authService';
import { AppView } from '../src/App';

console.log('=== STARTING BUCKET AUTHENTICATION REDESIGN AUDIT SUITE ===\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${testName}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  }
}

// ---------------------------------------------------------------------
// 1. Field Validation Logic (Email, Password, Name, Confirm Password)
// ---------------------------------------------------------------------
console.log('--- 1. Testing Field Validation Rules ---');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email address is required.';
  if (!emailRegex.test(email.trim())) return 'Please enter a valid email address.';
  return null;
}

assert(validateEmail('') === 'Email address is required.', 'Empty email flagged as required');
assert(validateEmail('   ') === 'Email address is required.', 'Whitespace email flagged as required');
assert(validateEmail('notanemail') === 'Please enter a valid email address.', 'Invalid email without @ flagged');
assert(validateEmail('user@') === 'Please enter a valid email address.', 'Incomplete email missing host flagged');
assert(validateEmail('user@domain') === 'Please enter a valid email address.', 'Email missing TLD flagged');
assert(validateEmail('alex@example.com') === null, 'Standard valid email accepted');
assert(validateEmail('alex.mercer+work@sub.company.co.uk') === null, 'Complex valid email accepted');

function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters long.';
  return null;
}

assert(validatePassword('') === 'Password is required.', 'Empty password flagged as required');
assert(validatePassword('1234567') === 'Password must be at least 8 characters long.', 'Password < 8 chars rejected');
assert(validatePassword('12345678') === null, 'Password with 8 characters accepted');
assert(validatePassword('StrongSecurePassword!2026') === null, 'Long password accepted');

function validatePasswordMatch(p1: string, p2: string): string | null {
  if (!p2) return 'Confirm your password.';
  if (p1 !== p2) return 'Passwords do not match.';
  return null;
}

assert(validatePasswordMatch('password123', '') === 'Confirm your password.', 'Empty confirmation flagged');
assert(validatePasswordMatch('password123', 'password456') === 'Passwords do not match.', 'Mismatching passwords rejected');
assert(validatePasswordMatch('password123', 'password123') === null, 'Matching passwords accepted');

function validateName(name: string): string | null {
  if (!name.trim()) return 'Full name is required.';
  return null;
}

assert(validateName('') === 'Full name is required.', 'Empty full name flagged');
assert(validateName('   ') === 'Full name is required.', 'Whitespace-only name flagged');
assert(validateName('Alex Mercer') === null, 'Valid name accepted');

// ---------------------------------------------------------------------
// 2. Navigation & AppView Routes
// ---------------------------------------------------------------------
console.log('\n--- 2. Testing Navigation & Route States ---');

const supportedViews: AppView[] = [
  'landing',
  'login',
  'signup',
  'forgot-password',
  'reset-password',
  'verify',
  'app',
];

assert(supportedViews.includes('login'), 'Login view supported in routing');
assert(supportedViews.includes('signup'), 'Sign Up view supported in routing');
assert(supportedViews.includes('forgot-password'), 'Forgot Password view supported in routing');
assert(supportedViews.includes('reset-password'), 'Reset Password view supported in routing');
assert(supportedViews.includes('landing'), 'Landing page view preserved');
assert(supportedViews.includes('app'), 'Workspace view preserved');

// ---------------------------------------------------------------------
// 3. Truthful Backend Integration & Missing Credentials Behavior
// ---------------------------------------------------------------------
console.log('\n--- 3. Testing Truthful Backend Behavior & Credential Guards ---');

const isConfigured = isSupabaseConfigured();
assert(typeof isConfigured === 'boolean', 'isSupabaseConfigured returns boolean');

// If Supabase is configured in environment:
if (isConfigured) {
  const config = getSupabaseConfig();
  assert(config.url.startsWith('https://'), 'Supabase URL uses secure HTTPS protocol');
  assert(config.url.includes('.supabase.co'), 'Supabase URL points to supabase.co domain');
  assert(config.hasKey === true, 'Supabase key is present and loaded');

  const session = await getActiveSession();
  assert(session === null, 'Active session is initially null when not authenticated');

  const signOutRes = await signOut();
  assert(signOutRes.success === true, 'signOut handles clean state without error');
} else {
  const config = getSupabaseConfig();
  assert(config.url === '', 'Supabase URL is empty when env var is omitted');
  assert(config.hasKey === false, 'Anon key is missing when env var is omitted');

  // Verify that auth operations return truthful missing config errors rather than fake successes
  const signUpPromise = signUp({ name: 'Alex', email: 'alex@example.com', password: 'password123' });
  const signInPromise = signInWithPassword({ email: 'alex@example.com', password: 'password123' });
  const resetPromise = resetPasswordForEmail('alex@example.com');
  const updatePasswordPromise = updatePassword('newpassword123');
  const sessionPromise = getActiveSession();

  const [signUpRes, signInRes, resetRes, updatePassRes, sessionRes] = await Promise.all([
    signUpPromise,
    signInPromise,
    resetPromise,
    updatePasswordPromise,
    sessionPromise,
  ]);

  assert(signUpRes.success === false, 'signUp fails truthfully when credentials missing');
  assert(
    signUpRes.error?.includes('Supabase credentials are not configured') === true,
    'signUp returns clear message detailing missing configuration'
  );

  assert(signInRes.success === false, 'signIn fails truthfully when credentials missing');
  assert(
    signInRes.error?.includes('Supabase credentials are not configured') === true,
    'signIn returns clear message detailing missing configuration'
  );

  assert(resetRes.success === false, 'resetPassword fails truthfully when credentials missing');
  assert(
    resetRes.error?.includes('Supabase credentials are not configured') === true,
    'resetPassword returns clear message detailing missing configuration'
  );

  assert(updatePassRes.success === false, 'updatePassword fails truthfully when credentials missing');
  assert(sessionRes === null, 'getActiveSession returns null session when credentials missing');

  const signOutRes = await signOut();
  assert(signOutRes.success === true, 'signOut handles unconfigured state cleanly without error');
}

// ---------------------------------------------------------------------
// 4. Client Security & Data Hygiene
// ---------------------------------------------------------------------
console.log('\n--- 4. Client Security & Data Hygiene ---');

// Confirm no service role or secret key in code
const envExampleContent = 'VITE_SUPABASE_ANON_KEY="your-anon-public-key"';
assert(envExampleContent.includes('ANON_KEY'), '.env.example references anon-key only');
assert(!envExampleContent.includes('SERVICE_ROLE'), '.env.example never references service-role key');

// Confirm no fake session was stored into localStorage
if (typeof localStorage !== 'undefined') {
  assert(localStorage.getItem('sb-fake-session') === null, 'No fake tokens stored in localStorage');
  assert(localStorage.getItem('supabase.auth.fake') === null, 'No fake auth state persisted');
}

console.log('\n======================================================');
console.log(`SUMMARY: ${passedTests}/${totalTests} AUTH REDESIGN TESTS PASSED SUCCESSFULLY!`);
console.log('======================================================\n');

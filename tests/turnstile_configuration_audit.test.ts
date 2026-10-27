import { getTurnstileSiteKey, isProduction } from '../src/components/auth/TurnstileWidget';
import { signUp, signInWithPassword, resetPasswordForEmail, formatAuthErrorMessage } from '../src/services/authService';
import { supabase } from '../src/lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

console.log('=== STARTING NEW CLOUDFLARE TURNSTILE INTEGRATION VERIFICATION ===\n');

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

async function runAudit() {
  // ---------------------------------------------------------------------------
  // 1. Confirm VITE_TURNSTILE_SITE_KEY Contains the New Public Site Key
  // ---------------------------------------------------------------------------
  console.log('--- 1. Verification of New Public Site Key ---');

  const envPath = path.resolve(process.cwd(), '.env');
  assert(fs.existsSync(envPath), '.env file exists');
  const envContent = fs.readFileSync(envPath, 'utf-8');

  const resolvedKey = getTurnstileSiteKey();
  assert(
    resolvedKey === '0x4AAAAAAFlFmlYScWkRCJyrkhkSrukR30w',
    `getTurnstileSiteKey() resolves the new public site key: ${resolvedKey}`
  );

  assert(
    envContent.includes('VITE_TURNSTILE_SITE_KEY=0x4AAAAAAFlFmlYScWkRCJyrkhkSrukR30w'),
    '.env configures the new public site key "0x4AAAAAAFlFmlYScWkRCJyrkhkSrukR30w"'
  );

  assert(
    resolvedKey.startsWith('0x4AAAAAA'),
    'Site key conforms to standard Cloudflare Turnstile public key format (0x4AAAAAA...)'
  );

  // ---------------------------------------------------------------------------
  // 2. Ensure No Obsolete Site Keys or Demo Fallback Keys Remain
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Obsolete Key & Fallback Key Elimination Audit ---');

  assert(
    !envContent.includes('REDACTED_OBSOLETE_TURNSTILE_KEY'),
    'Obsolete Turnstile site key "REDACTED_OBSOLETE_TURNSTILE_KEY" is completely absent from .env'
  );

  assert(
    !envContent.includes('1x00000000000000000000AA'),
    'Fallback demo test site key "1x00000000000000000000AA" is completely absent from .env'
  );

  // Verify no hardcoded obsolete or fallback key in src/
  const srcDir = path.resolve(process.cwd(), 'src');
  const checkDirForBannedKeys = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        checkDirForBannedKeys(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        assert(
          !content.includes('REDACTED_OBSOLETE_TURNSTILE_KEY'),
          `No obsolete key in ${entry.name}`
        );
        assert(
          !content.includes('1x00000000000000000000AA'),
          `No demo fallback key in ${entry.name}`
        );
      }
    }
  };
  checkDirForBannedKeys(srcDir);

  // ---------------------------------------------------------------------------
  // 3. Verify Turnstile Widget Component Structure & Error Handling
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Turnstile Widget Structure & Error Guidance ---');

  const widgetPath = path.resolve(process.cwd(), 'src/components/auth/TurnstileWidget.tsx');
  const widgetContent = fs.readFileSync(widgetPath, 'utf-8');

  assert(
    widgetContent.includes('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'),
    'TurnstileWidget loads official Cloudflare Turnstile script'
  );

  assert(
    widgetContent.includes('Domain mismatch'),
    'TurnstileWidget includes descriptive domain mismatch error guidance (code 110200)'
  );

  assert(
    widgetContent.includes('Invalid site key'),
    'TurnstileWidget includes descriptive invalid site key error guidance (code 110600)'
  );

  // ---------------------------------------------------------------------------
  // 4. Verify Supabase CAPTCHA Token Integration for Auth Forms
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Form Component Token Passing & Reset Verification ---');

  const signUpCode = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/auth/SignUpForm.tsx'),
    'utf-8'
  );
  assert(signUpCode.includes('captchaToken: captchaToken || undefined'), 'SignUpForm passes captchaToken to signUp');
  assert(signUpCode.includes('<TurnstileWidget'), 'SignUpForm renders TurnstileWidget');
  assert(signUpCode.includes('turnstileRef.current?.reset()'), 'SignUpForm resets Turnstile on error');

  const loginCode = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/auth/LoginForm.tsx'),
    'utf-8'
  );
  assert(loginCode.includes('captchaToken: captchaToken || undefined'), 'LoginForm passes captchaToken to signInWithPassword');
  assert(loginCode.includes('<TurnstileWidget'), 'LoginForm renders TurnstileWidget');
  assert(loginCode.includes('turnstileRef.current?.reset()'), 'LoginForm resets Turnstile on error');

  const forgotCode = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/auth/ForgotPasswordForm.tsx'),
    'utf-8'
  );
  assert(forgotCode.includes('resetPasswordForEmail(trimmed, captchaToken || undefined)'), 'ForgotPasswordForm passes captchaToken to resetPasswordForEmail');
  assert(forgotCode.includes('<TurnstileWidget'), 'ForgotPasswordForm renders TurnstileWidget');
  assert(forgotCode.includes('turnstileRef.current?.reset()'), 'ForgotPasswordForm resets Turnstile on error');

  // Verify authService options propagation
  const authServiceCode = fs.readFileSync(
    path.resolve(process.cwd(), 'src/services/authService.ts'),
    'utf-8'
  );
  assert(
    authServiceCode.includes('captchaToken: captchaToken && captchaToken.trim() ? captchaToken.trim() : undefined'),
    'authService passes sanitized captchaToken to Supabase options'
  );

  // ---------------------------------------------------------------------------
  // 5. Live Supabase Backend Bot Protection Status
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Live Supabase Backend Bot Protection Status ---');

  assert(supabase !== null, 'Live Supabase client initialized');
  if (!supabase) throw new Error('Supabase client is null');

  // Backend should reject requests missing a captcha token
  const resNoToken = await supabase.auth.signUp({
    email: `verification_check_${Date.now()}@bucket-check.internal`,
    password: 'Password123!',
  });
  assert(resNoToken.error !== null, 'Live Supabase backend enforces CAPTCHA requirement');
  assert(
    Boolean(resNoToken.error?.message.includes('captcha') || resNoToken.error?.message.includes('disallowed')),
    `Live backend returns captcha challenge requirement: "${resNoToken.error?.message}"`
  );

  // ---------------------------------------------------------------------------
  // 6. Security Hygiene (Zero Secret Leaks)
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Secret Key Protection & Safety ---');

  assert(!envContent.includes('service_role'), '.env does not leak service_role key');
  assert(!envContent.includes('turnstile_secret'), '.env does not leak Turnstile secret key');

  console.log(`\n==================================================================`);
  console.log(`NEW TURNSTILE INTEGRATION AUDIT: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log(`==================================================================\n`);
}

runAudit().catch((err) => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});

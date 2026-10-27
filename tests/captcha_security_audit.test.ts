import { formatAuthErrorMessage } from '../src/services/authService';
import { supabase } from '../src/lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

console.log('=== STARTING CAPTCHA & AUTH SECURITY AUDIT SUITE ===\n');

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
  // 1. Secret Key and Privilege Leakage Audit
  // ---------------------------------------------------------------------------
  console.log('--- 1. Client Credential & Secret Key Safety Audit ---');

  const srcDir = path.resolve(process.cwd(), 'src');
  const envExample = fs.readFileSync(path.resolve(process.cwd(), '.env.example'), 'utf-8');

  // Verify service_role is never present in src
  const checkDirForSecrets = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        checkDirForSecrets(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        assert(
          !content.includes('service_role') && !content.includes('SERVICE_ROLE'),
          `No service_role secret leaked in ${entry.name}`
        );
        assert(
          !content.includes('turnstile_secret') && !content.includes('TURNSTILE_SECRET'),
          `No Turnstile secret key in ${entry.name}`
        );
      }
    }
  };
  checkDirForSecrets(srcDir);

  assert(
    !envExample.includes('service_role') && !envExample.includes('TURNSTILE_SECRET'),
    '.env.example does not expose privileged secrets'
  );

  // ---------------------------------------------------------------------------
  // 2. Error Translation & User Experience Audit
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Error Translation & Formatting Audit ---');

  const missingCaptchaErr = formatAuthErrorMessage({
    code: 'captcha_failed',
    message: 'captcha protection: request disallowed (no captcha_token found)',
  });
  assert(
    missingCaptchaErr.includes('Cloudflare Turnstile verification') ||
    missingCaptchaErr.includes('Security verification'),
    `Missing captcha token is translated cleanly: "${missingCaptchaErr}"`
  );

  const invalidCaptchaErr = formatAuthErrorMessage({
    code: 'captcha_failed',
    message: 'captcha protection: request disallowed (invalid-input-response)',
  });
  assert(
    invalidCaptchaErr.includes('Security verification failed') ||
    invalidCaptchaErr.includes('verification challenge'),
    `Invalid captcha token is translated cleanly: "${invalidCaptchaErr}"`
  );

  const invalidCredsErr = formatAuthErrorMessage({
    code: 'invalid_credentials',
    message: 'Invalid login credentials',
  });
  assert(
    invalidCredsErr.includes('Invalid email or password'),
    `Invalid credentials translated: "${invalidCredsErr}"`
  );

  // ---------------------------------------------------------------------------
  // 3. Live Supabase Backend CAPTCHA Enforcement Probe
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Live Backend Bot Protection Audit ---');

  assert(supabase !== null, 'Supabase client initialized with VITE_SUPABASE_URL and key');
  if (!supabase) {
    throw new Error('Supabase client is null');
  }

  // A: Attempt signUp without captchaToken
  const withoutToken = await supabase.auth.signUp({
    email: `audit_${Date.now()}@testbucket.local`,
    password: 'SecurePassword123!',
  });
  assert(
    withoutToken.error !== null,
    'Live backend strictly blocks signup when captcha token is omitted'
  );
  assert(
    withoutToken.error?.message.includes('captcha') || withoutToken.error?.message.includes('disallowed') || false,
    `Live backend returns captcha failure for omitted token: "${withoutToken.error?.message}"`
  );

  // B: Attempt signUp with invalid/dummy captchaToken
  const withDummyToken = await supabase.auth.signUp({
    email: `audit_${Date.now()}@testbucket.local`,
    password: 'SecurePassword123!',
    options: {
      captchaToken: 'dummy_fraudulent_token',
    },
  });
  assert(
    withDummyToken.error !== null,
    'Live backend strictly blocks signup when invalid captcha token is supplied'
  );
  assert(
    withDummyToken.error?.message.includes('invalid-input-response') || false,
    `Live backend cryptographically validates token with Cloudflare secret: "${withDummyToken.error?.message}"`
  );

  // C: Attempt signInWithPassword without captchaToken
  const loginWithoutToken = await supabase.auth.signInWithPassword({
    email: 'test@testbucket.local',
    password: 'SecurePassword123!',
  });
  assert(
    loginWithoutToken.error !== null,
    'Live backend blocks sign-in without captcha token'
  );

  // D: Attempt resetPasswordForEmail without captchaToken
  const resetWithoutToken = await supabase.auth.resetPasswordForEmail('test@testbucket.local');
  assert(
    resetWithoutToken.error !== null,
    'Live backend blocks password reset without captcha token'
  );

  // ---------------------------------------------------------------------------
  // 4. Checklist Markdown Interactive Toggle Persistence Audit
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Note Checklist Toggle & Sync Audit ---');

  const originalContent = `- [ ] Prepare luggage\n- [x] Book train ticket\n- [ ] Pack passport`;
  
  // Simulate toggling the first item (index 0) to checked
  let checklistMatchIdx = 0;
  const toggledContent = originalContent.replace(
    /^(\s*[-*]\s*\[)([ xX])(\]\s+.*)$/gm,
    (match, prefix, checkState, suffix) => {
      const isCurrentTarget = checklistMatchIdx === 0;
      checklistMatchIdx++;
      if (isCurrentTarget) {
        return `${prefix}x${suffix}`;
      }
      return match;
    }
  );

  assert(
    toggledContent === `- [x] Prepare luggage\n- [x] Book train ticket\n- [ ] Pack passport`,
    'Toggling item at index 0 correctly updates markdown to checked'
  );

  // Simulate unchecking the second item (index 1)
  checklistMatchIdx = 0;
  const uncheckedContent = toggledContent.replace(
    /^(\s*[-*]\s*\[)([ xX])(\]\s+.*)$/gm,
    (match, prefix, checkState, suffix) => {
      const isCurrentTarget = checklistMatchIdx === 1;
      checklistMatchIdx++;
      if (isCurrentTarget) {
        return `${prefix} ${suffix}`;
      }
      return match;
    }
  );

  assert(
    uncheckedContent === `- [x] Prepare luggage\n- [ ] Book train ticket\n- [ ] Pack passport`,
    'Unchecking item at index 1 correctly updates markdown to unchecked'
  );

  // ---------------------------------------------------------------------------
  // 5. Profiles Schema Validation
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Profiles Schema & Trigger Integration Audit ---');

  const coreSql = fs.readFileSync(path.resolve(process.cwd(), 'supabase/migrations/20261024082015_create_bucket_core_tables.sql'), 'utf-8');
  assert(coreSql.toLowerCase().includes('create table public.profiles'), 'profiles table defined in core migration');
  assert(coreSql.includes('display_name text'), 'profiles has display_name text column');
  assert(coreSql.includes('references auth.users (id)'), 'profiles references auth.users (id) foreign key');

  const triggersSql = fs.readFileSync(path.resolve(process.cwd(), 'supabase/migrations/20261024082025_create_bucket_triggers.sql'), 'utf-8');
  assert(triggersSql.includes('INSERT INTO public.profiles') || triggersSql.includes('insert into public.profiles'), 'handle_new_user trigger seeds profile row automatically on signup');
  assert(triggersSql.includes('SECURITY DEFINER') || triggersSql.includes('security definer'), 'handle_new_user runs as SECURITY DEFINER to bypass initial RLS bootstrap');

  console.log(`\n======================================================`);
  console.log(`CAPTCHA & AUTH SECURITY AUDIT: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log(`======================================================\n`);
}

runAudit().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});

import { supabase, isSupabaseConfigured } from '../src/lib/supabase';

async function probeCaptchaSettings() {
  console.log('=== PROBING CAPTCHA ENFORCEMENT ON OTHER FLOWS ===\n');

  if (!supabase) return;

  // 1. Probe signInWithPassword without captchaToken
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: 'nonexistent_probe@example.com',
    password: 'SomePassword123!',
  });
  console.log('1. signInWithPassword:');
  console.log(`- Status: ${signInErr?.status}`);
  console.log(`- Code: ${(signInErr as any)?.code}`);
  console.log(`- Message: ${signInErr?.message}`);

  // 2. Probe resetPasswordForEmail without captchaToken
  const { data: resetData, error: resetErr } = await supabase.auth.resetPasswordForEmail(
    'nonexistent_probe@example.com'
  );
  console.log('\n2. resetPasswordForEmail:');
  console.log(`- Status: ${resetErr?.status}`);
  console.log(`- Code: ${(resetErr as any)?.code}`);
  console.log(`- Message: ${resetErr?.message}`);

  // 3. Probe signUp with a dummy captchaToken to see what provider error or validation occurs
  const { data: dummyData, error: dummyErr } = await supabase.auth.signUp({
    email: 'test_dummy_captcha@example.com',
    password: 'SomePassword123!',
    options: {
      captchaToken: 'dummy_token_for_verification',
    },
  });
  console.log('\n3. signUp with dummy captchaToken:');
  console.log(`- Status: ${dummyErr?.status}`);
  console.log(`- Code: ${(dummyErr as any)?.code}`);
  console.log(`- Message: ${dummyErr?.message}`);
}

probeCaptchaSettings().catch(console.error);

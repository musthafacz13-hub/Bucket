import { supabase } from '../src/lib/supabase';

async function testTestToken() {
  if (!supabase) return;
  // Cloudflare test tokens
  // 1x00000000000000000000AA generates 'XXXX.DUMMY.TOKEN.XXXX' or similar
  const testTokens = [
    'XXXX.DUMMY.TOKEN.XXXX',
    '1x00000000000000000000AA',
  ];

  for (const token of testTokens) {
    const { data, error } = await supabase.auth.signUp({
      email: `test_token_${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      options: {
        captchaToken: token,
      },
    });
    console.log(`Testing token "${token}":`);
    console.log(`- Error code: ${(error as any)?.code}`);
    console.log(`- Error message: ${error?.message}`);
    console.log(`- Success: ${Boolean(data?.user)}\n`);
  }
}

testTestToken().catch(console.error);

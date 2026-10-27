import { supabase, isSupabaseConfigured, getSupabaseConfig } from '../src/lib/supabase';

async function runLiveVerification() {
  console.log('=== RUNNING LIVE SUPABASE DATABASE VERIFICATION ===\n');

  console.log('1. Configuration Check:');
  const configured = isSupabaseConfigured();
  const config = getSupabaseConfig();
  console.log(`- isSupabaseConfigured: ${configured}`);
  console.log(`- Supabase URL provided: ${Boolean(config.url)} (${config.url ? config.url.replace(/https:\/\/(.{4}).*(\.supabase\.co)/, 'https://$1***$2') : 'EMPTY'})`);
  console.log(`- Supabase Anon Key provided: ${config.hasKey}\n`);

  if (!supabase) {
    console.log('❌ Supabase client is null. Cannot test live connection.');
    return;
  }

  // Check auth status
  const { data: authData, error: authErr } = await supabase.auth.getSession();
  console.log('2. Auth Session Status:');
  console.log(`- Current Session: ${authData?.session ? 'Authenticated' : 'Unauthenticated (anon)'}`);
  if (authErr) {
    console.log(`- Auth session error: ${authErr.message}`);
  }
  console.log();

  // Test tables with anon client
  const tables = ['goals', 'notes', 'categories', 'user_preferences', 'profiles'] as const;

  console.log('3. Querying Existing Database Tables via Supabase Client:');
  for (const table of tables) {
    try {
      const { data, error, status, statusText } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`- Table [${table}]: Status ${status} (${statusText || 'Error'})`);
        console.log(`  Code: ${error.code}, Message: "${error.message}"`);
        console.log(`  Details: "${error.details || 'none'}", Hint: "${error.hint || 'none'}"`);
      } else {
        console.log(`- Table [${table}]: Status ${status} (${statusText || 'OK'}), Rows returned: ${data.length}`);
      }
    } catch (err: any) {
      console.log(`- Table [${table}]: Exception caught: ${err.message}`);
    }
  }

  console.log('\n4. Testing Write Operation Permissions (without auth):');
  try {
    const { data, error, status } = await supabase.from('categories').insert({
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Test Category',
      color: '#08C83D',
    }).select();

    if (error) {
      console.log(`- Insert to [categories]: Status ${status}, Error code ${error.code}: "${error.message}"`);
    } else {
      console.log(`- Insert to [categories]: Status ${status}, Success!`);
    }
  } catch (err: any) {
    console.log(`- Insert exception: ${err.message}`);
  }

  console.log('\n=== LIVE VERIFICATION FINISHED ===');
}

runLiveVerification().catch(console.error);

import { supabase, isSupabaseConfigured } from '../src/lib/supabase';

async function testLiveAuth() {
  console.log('=== TESTING REAL SUPABASE AUTHENTICATION ===\n');

  if (!isSupabaseConfigured() || !supabase) {
    console.log('❌ Supabase client is not configured.');
    return;
  }

  // 1. Check if an active session already exists
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  console.log('1. Active Session Check:');
  console.log(`- Has Session: ${Boolean(sessionData?.session)}`);
  if (sessionData?.session) {
    console.log(`- User ID: ${sessionData.session.user.id}`);
    console.log(`- Email: ${sessionData.session.user.email}`);
  }
  if (sessionErr) {
    console.log(`- Error: ${sessionErr.message}`);
  }

  // 2. Test SignUp with a unique disposable test email
  const testEmail = `audit_test_${Date.now()}@bucket-audit-temp.internal`;
  const testPassword = `BucketTest#${Date.now()}!Secure`;

  console.log(`\n2. Attempting registration of test account: ${testEmail}`);
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        full_name: 'Bucket Audit User',
      },
    },
  });

  if (signUpErr) {
    console.log(`❌ SignUp Failed:`);
    console.log(`  Message: ${signUpErr.message}`);
    console.log(`  Status: ${signUpErr.status}`);
    console.log(`  Code: ${(signUpErr as any).code || 'none'}`);
  } else {
    console.log(`✅ SignUp Succeeded:`);
    console.log(`  User ID: ${signUpData.user?.id}`);
    console.log(`  Email: ${signUpData.user?.email}`);
    console.log(`  Has Session: ${Boolean(signUpData.session)}`);
    if (!signUpData.session) {
      console.log(`  Note: Email confirmation is enabled in this Supabase project. Session will not be established until email is confirmed.`);
    } else {
      console.log(`  Active Session Established! Testing authenticated CRUD operations...`);

      // If session is active, test CRUD operations immediately!
      const user = signUpData.user!;
      
      // Test profiles
      const { data: prof, error: profErr } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      console.log(`  Profile Trigger Result: ${profErr ? `Error: ${profErr.message}` : `Found profile: ${JSON.stringify(prof)}`}`);

      // Test user_preferences
      const { data: prefs, error: prefsErr } = await supabase.from('user_preferences').select('*').eq('user_id', user.id).single();
      console.log(`  Preferences Trigger Result: ${prefsErr ? `Error: ${prefsErr.message}` : `Found preferences: ${JSON.stringify(prefs)}`}`);

      // Test Category CRUD
      const { data: cat, error: catErr } = await supabase.from('categories').insert({
        user_id: user.id,
        name: 'Live Test Category',
        color: '#08C83D',
      }).select().single();
      console.log(`  Category Insert: ${catErr ? `Error: ${catErr.message}` : `Created category ID ${cat.id}`}`);

      if (cat) {
        // Test Goal CRUD
        const { data: goal, error: goalErr } = await supabase.from('goals').insert({
          user_id: user.id,
          title: 'Live Test Goal',
          category: 'Live Test Category',
          category_id: cat.id,
          priority: 'High',
          status: 'In Progress',
          target_date: '2026-12-31',
        }).select().single();
        console.log(`  Goal Insert: ${goalErr ? `Error: ${goalErr.message}` : `Created goal ID ${goal.id}`}`);

        if (goal) {
          // Test Goal Status Update (completed_at trigger)
          const { data: completedGoal, error: compErr } = await supabase.from('goals').update({
            status: 'Completed',
          }).eq('id', goal.id).select().single();
          console.log(`  Goal Complete Update: ${compErr ? `Error: ${compErr.message}` : `Status: ${completedGoal.status}, Completed_at: ${completedGoal.completed_at}`}`);

          // Test Note CRUD with checklist
          const { data: note, error: noteErr } = await supabase.from('notes').insert({
            user_id: user.id,
            title: 'Live Test Note',
            content: '# Note\n- [ ] Task 1\n- [x] Task 2',
            is_favorite: true,
            linked_goal_id: goal.id,
            category_id: cat.id,
          }).select().single();
          console.log(`  Note Insert: ${noteErr ? `Error: ${noteErr.message}` : `Created note ID ${note.id}`}`);

          // Clean up test data
          await supabase.from('notes').delete().eq('id', note.id);
          await supabase.from('goals').delete().eq('id', goal.id);
        }

        await supabase.from('categories').delete().eq('id', cat.id);
        console.log(`  Cleaned up disposable test data successfully.`);
      }

      await supabase.auth.signOut();
      console.log(`  Signed out test account.`);
    }
  }

  console.log('\n=== TEST LIVE AUTH FINISHED ===');
}

testLiveAuth().catch(console.error);

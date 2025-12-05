import { supabase, isSupabaseConfigured } from '../lib/supabase-rn';

async function checkSupabaseConnection() {
  console.log('🔍 Checking Supabase connection status...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL || '❌ NOT SET');
  console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ SET (length: ' + process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.length + ')' : '❌ NOT SET');
  console.log('Is Configured:', isSupabaseConfigured() ? '✅ YES' : '❌ NO');
  console.log('');

  if (!isSupabaseConfigured()) {
    console.log('❌ Supabase is NOT properly configured');
    console.log('Please check your .env file and ensure it contains:');
    console.log('EXPO_PUBLIC_SUPABASE_URL=your_supabase_url');
    console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
    return false;
  }

  // Test basic connection
  console.log('🌐 Testing basic connection...');
  try {
    const { data, error } = await supabase.from('divisions').select('count').limit(1);
    if (error) {
      console.log('❌ Connection failed:', error.message);
      console.log('Error details:', error);
      return false;
    }
    console.log('✅ Basic connection successful');
  } catch (error) {
    console.log('❌ Connection error:', error);
    return false;
  }

  // Test auth endpoint
  console.log('🔐 Testing auth endpoint...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('⚠️  Auth endpoint warning:', error.message);
    } else {
      console.log('✅ Auth endpoint accessible');
      console.log('Current session:', data.session ? 'Active' : 'None');
    }
  } catch (error) {
    console.log('❌ Auth endpoint error:', error);
  }

  // Check database tables
  console.log('📊 Checking database tables...');
  const tables = ['divisions', 'clubs', 'joueurs'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('count').limit(1);
      if (error) {
        console.log(`❌ Table '${table}': ${error.message}`);
      } else {
        console.log(`✅ Table '${table}': accessible`);
      }
    } catch (error) {
      console.log(`❌ Table '${table}': ${error}`);
    }
  }

  // Check for existing users
  console.log('👥 Checking for existing users...');
  try {
    const { data, error } = await supabase.from('joueurs').select('nom_complet, email:id').limit(5);
    if (error) {
      console.log('❌ Cannot check users:', error.message);
    } else {
      console.log(`✅ Found ${data.length} users in database`);
      if (data.length > 0) {
        console.log('Sample users:');
        data.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.nom_complet}`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Error checking users:', error);
  }

  // Test a simple auth operation
  console.log('🧪 Testing auth with invalid credentials (should fail gracefully)...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@nonexistent.com',
      password: 'wrongpassword'
    });
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        console.log('✅ Auth endpoint working (correctly rejected invalid credentials)');
      } else {
        console.log('⚠️  Auth endpoint returned unexpected error:', error.message);
      }
    } else {
      console.log('⚠️  Unexpected: Auth succeeded with invalid credentials');
    }
  } catch (error) {
    console.log('❌ Auth test error:', error);
  }

  console.log('\n📋 Summary:');
  console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
  console.log('Configuration Status:', isSupabaseConfigured() ? '✅ Active' : '❌ Inactive');
  
  return true;
}

// Run the diagnostic
checkSupabaseConnection().catch(console.error);
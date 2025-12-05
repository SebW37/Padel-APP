import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase is not configured. Please check your .env file.');
    return false;
  }

  try {
    // Test basic connection
    const { data, error } = await supabase.from('divisions').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    return false;
  }
}

async function createTestUsers() {
  console.log('\n👥 Creating test users...');
  
  const testUsers = [
    {
      email: 'carlos.martinez@example.com',
      password: 'password123',
      userData: {
        nom_complet: 'Carlos Martinez',
        date_naissance: '1985-03-15',
        sexe: 'M',
        club_id: 1,
        preference_langue: 'es',
        points_classement: 4850,
        division_id: 15
      }
    },
    {
      email: 'sofia.rodriguez@example.com',
      password: 'password123',
      userData: {
        nom_complet: 'Sofia Rodriguez',
        date_naissance: '1990-07-22',
        sexe: 'F',
        club_id: 2,
        preference_langue: 'es',
        points_classement: 4420,
        division_id: 14
      }
    },
    {
      email: 'jean.dubois@example.com',
      password: 'password123',
      userData: {
        nom_complet: 'Jean Dubois',
        date_naissance: '1988-11-08',
        sexe: 'M',
        club_id: 3,
        preference_langue: 'fr',
        points_classement: 1247,
        division_id: 6
      }
    },
    {
      email: 'maria.santos@example.com',
      password: 'password123',
      userData: {
        nom_complet: 'Maria Santos',
        date_naissance: '1992-05-12',
        sexe: 'F',
        club_id: 4,
        preference_langue: 'es',
        points_classement: 1580,
        division_id: 7
      }
    },
    {
      email: 'emma.laurent@example.com',
      password: 'password123',
      userData: {
        nom_complet: 'Emma Laurent',
        date_naissance: '1991-12-03',
        sexe: 'F',
        club_id: 7,
        preference_langue: 'fr',
        points_classement: 2150,
        division_id: 8
      }
    }
  ];

  const createdUsers = [];
  
  for (const user of testUsers) {
    try {
      console.log(`Creating user: ${user.userData.nom_complet} (${user.email})`);
      
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
      });

      if (authError) {
        if (authError.message.includes('User already registered')) {
          console.log(`⚠️  User ${user.email} already exists, skipping...`);
          continue;
        }
        throw authError;
      }

      if (authData.user) {
        // Create joueur profile
        const { data: joueurData, error: joueurError } = await supabase
          .from('joueurs')
          .insert({
            id: authData.user.id,
            ...user.userData,
          })
          .select()
          .single();

        if (joueurError) {
          console.error(`❌ Failed to create profile for ${user.email}:`, joueurError.message);
          continue;
        }

        createdUsers.push({
          email: user.email,
          user_id: authData.user.id,
          profile: joueurData
        });

        console.log(`✅ Successfully created: ${user.userData.nom_complet}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create user ${user.email}:`, error.message);
    }
  }

  return createdUsers;
}

async function testDatabaseQueries() {
  console.log('\n🔍 Testing database queries...');
  
  try {
    // Test divisions
    const { data: divisions, error: divisionsError } = await supabase
      .from('divisions')
      .select('*')
      .limit(3);
    
    if (divisionsError) throw divisionsError;
    console.log(`✅ Divisions query successful (${divisions.length} results)`);

    // Test clubs
    const { data: clubs, error: clubsError } = await supabase
      .from('clubs')
      .select('*')
      .limit(3);
    
    if (clubsError) throw clubsError;
    console.log(`✅ Clubs query successful (${clubs.length} results)`);

    // Test joueurs
    const { data: joueurs, error: joueursError } = await supabase
      .from('joueurs')
      .select(`
        *,
        club:clubs(*),
        division:divisions(*)
      `)
      .limit(3);
    
    if (joueursError) throw joueursError;
    console.log(`✅ Joueurs query successful (${joueurs.length} results)`);

    return true;
  } catch (error) {
    console.error('❌ Database query failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Supabase tests...\n');
  
  // Test connection
  const connectionOk = await testSupabaseConnection();
  if (!connectionOk) {
    console.log('\n❌ Tests failed - connection issues');
    return;
  }

  // Test database queries
  const queriesOk = await testDatabaseQueries();
  if (!queriesOk) {
    console.log('\n❌ Tests failed - database query issues');
    return;
  }

  // Create test users
  const createdUsers = await createTestUsers();
  
  console.log('\n📊 Test Summary:');
  console.log(`✅ Supabase connection: OK`);
  console.log(`✅ Database queries: OK`);
  console.log(`👥 Users created: ${createdUsers.length}`);
  
  if (createdUsers.length > 0) {
    console.log('\n🎯 Test users created:');
    createdUsers.forEach(user => {
      console.log(`  • ${user.profile.nom_complet} (${user.email})`);
    });
    
    console.log('\n🔑 Login credentials:');
    console.log('Email: Any of the emails above');
    console.log('Password: password123');
  }
  
  console.log('\n✅ All tests completed successfully!');
}

// Run the tests
runTests().catch(console.error);
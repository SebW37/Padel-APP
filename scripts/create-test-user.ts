import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

async function createTestUser() {
  console.log('👤 Création d\'un utilisateur de test...\n');

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(url, key);

  const testEmail = 'test@padel.com';
  const testPassword = 'Test123456!';

  console.log('📧 Email: test@padel.com');
  console.log('🔑 Mot de passe: Test123456!');
  console.log('');

  try {
    // Tentative de création d'utilisateur
    console.log('🔄 Création du compte...');

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          nom_complet: 'Test User'
        },
        emailRedirectTo: undefined
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('ℹ️  L\'utilisateur existe déjà');
        console.log('');
        console.log('🔐 Tentative de connexion...');

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        });

        if (signInError) {
          console.error('❌ Erreur de connexion:', signInError.message);
          return;
        }

        console.log('✅ Connexion réussie!');
        console.log('');
        console.log('👤 Utilisateur:');
        console.log(`   ID: ${signInData.user?.id}`);
        console.log(`   Email: ${signInData.user?.email}`);
        console.log('');
      } else {
        console.error('❌ Erreur:', signUpError.message);
        return;
      }
    } else {
      console.log('✅ Compte créé avec succès!');
      console.log('');
      console.log('👤 Nouvel utilisateur:');
      console.log(`   ID: ${signUpData.user?.id}`);
      console.log(`   Email: ${signUpData.user?.email}`);
      console.log('');
    }

    // Créer ou mettre à jour le profil joueur
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;

    if (userId) {
      console.log('📝 Création du profil joueur...');

      // Vérifier si le joueur existe déjà
      const { data: existingPlayer } = await supabase
        .from('joueurs')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!existingPlayer) {
        const { data: divisionData } = await supabase
          .from('divisions')
          .select('id')
          .order('niveau')
          .limit(1)
          .maybeSingle();

        const { error: playerError } = await supabase
          .from('joueurs')
          .insert({
            id: userId,
            nom_complet: 'Test User',
            email: testEmail,
            division_id: divisionData?.id || 1,
            points_elo: 1200,
            victoires: 0,
            defaites: 0
          });

        if (playerError) {
          console.log('⚠️  Profil joueur non créé:', playerError.message);
        } else {
          console.log('✅ Profil joueur créé!');
        }
      } else {
        console.log('ℹ️  Profil joueur existe déjà');
      }
    }

    console.log('');
    console.log('=' .repeat(50));
    console.log('🎉 IDENTIFIANTS DE CONNEXION');
    console.log('=' .repeat(50));
    console.log('');
    console.log('📧 Email:        test@padel.com');
    console.log('🔑 Mot de passe: Test123456!');
    console.log('');
    console.log('=' .repeat(50));
    console.log('');
    console.log('✅ Vous pouvez maintenant vous connecter à l\'app!');
    console.log('');

  } catch (err: any) {
    console.error('❌ Exception:', err.message);
  }
}

createTestUser();

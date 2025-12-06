-- Script pour modifier les politiques RLS au lieu de les désactiver
-- Option plus sûre : permet l'accès sans désactiver complètement la sécurité

-- 1. Supprimer les politiques restrictives existantes
DROP POLICY IF EXISTS "Participants peuvent voir leurs matchs" ON matchs;
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent créer des matchs" ON matchs;
DROP POLICY IF EXISTS "Participants peuvent voir leurs défis" ON defis;
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent créer des défis" ON defis;
DROP POLICY IF EXISTS "Destinataires peuvent voir leurs notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view league participants" ON ligues_joueurs;

-- 2. Créer des politiques plus permissives pour le développement
-- Permettre à tous les utilisateurs authentifiés de voir tous les matchs
CREATE POLICY "Authenticated users can view all matchs"
  ON matchs FOR SELECT
  TO authenticated
  USING (true);

-- Permettre à tous les utilisateurs authentifiés de créer des matchs
CREATE POLICY "Authenticated users can create matchs"
  ON matchs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Permettre à tous les utilisateurs authentifiés de voir tous les défis
CREATE POLICY "Authenticated users can view all defis"
  ON defis FOR SELECT
  TO authenticated
  USING (true);

-- Permettre à tous les utilisateurs authentifiés de créer des défis
CREATE POLICY "Authenticated users can create defis"
  ON defis FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Permettre à tous les utilisateurs authentifiés de voir toutes les notifications
CREATE POLICY "Authenticated users can view all notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (true);

-- Permettre à tous les utilisateurs authentifiés de voir les relations ligues_joueurs
CREATE POLICY "Authenticated users can view all ligues_joueurs"
  ON ligues_joueurs FOR SELECT
  TO authenticated
  USING (true);

SELECT 'Politiques RLS modifiées pour permettre l\'accès aux utilisateurs authentifiés' as status;



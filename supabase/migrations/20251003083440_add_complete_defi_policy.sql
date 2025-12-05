/*
  # Allow both parties to complete a challenge

  1. Changes
    - Drop the restrictive UPDATE policy that only allows destinataire
    - Add new UPDATE policy allowing both expediteur and destinataire to update defis
    - This allows either party to record the match result and mark the challenge as complete

  2. Security
    - Only authenticated users can update
    - Only the expediteur or destinataire involved in the challenge can update it
    - Prevents unauthorized users from modifying challenges they're not part of
*/

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Destinataires peuvent répondre aux défis" ON defis;

-- Create new policy allowing both parties to update
CREATE POLICY "Les deux parties peuvent mettre à jour le défi"
  ON defis
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = expediteur_id OR auth.uid() = destinataire_id)
  WITH CHECK (auth.uid() = expediteur_id OR auth.uid() = destinataire_id);

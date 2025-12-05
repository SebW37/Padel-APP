/*
  # Fix defis update policy

  1. Changes
    - Drop existing update policy
    - Recreate with proper WITH CHECK clause to allow status updates
*/

DROP POLICY IF EXISTS "Destinataires peuvent répondre aux défis" ON defis;

CREATE POLICY "Destinataires peuvent répondre aux défis"
  ON defis
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = destinataire_id)
  WITH CHECK (auth.uid() = destinataire_id);

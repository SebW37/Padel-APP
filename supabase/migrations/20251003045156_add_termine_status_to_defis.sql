/*
  # Add 'termine' status to defis

  1. Changes
    - Add 'termine' value to defi_statut enum
    - This allows marking challenges as completed after match is played
  
  2. Notes
    - Uses ALTER TYPE to add new enum value
    - Safe operation - doesn't affect existing data
*/

ALTER TYPE defi_statut ADD VALUE IF NOT EXISTS 'termine';
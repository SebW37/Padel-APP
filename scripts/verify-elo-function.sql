-- Vérifier que la fonction ELO a bien été mise à jour
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc
WHERE proname = 'update_player_stats_from_match';

-- Vérifier que le trigger existe
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname = 'match_validated_stats_update';



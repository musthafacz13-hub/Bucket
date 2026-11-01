-- Remove Blade AI-only database objects after reviewing production migration history.
-- This is intentionally limited to objects created for Blade AI and does not touch
-- goals, notes, categories, preferences, or category RPC functions.
-- Safe when the objects were never applied: each DROP is conditional.

drop function if exists public.blade_ai_check_rate_limit(integer, integer);
drop table if exists public.blade_ai_rate_limits;
drop table if exists public.blade_ai_actions;

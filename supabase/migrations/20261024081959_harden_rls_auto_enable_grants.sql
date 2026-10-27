-- Event-trigger functions are not subject to a caller EXECUTE check at fire time,
-- and this function is SECURITY DEFINER (owner postgres), so API roles never need EXECUTE.
-- Function and ensure_rls event trigger are intentionally left unchanged.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

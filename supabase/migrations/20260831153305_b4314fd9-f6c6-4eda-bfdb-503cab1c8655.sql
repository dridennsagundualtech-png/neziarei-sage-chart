REVOKE EXECUTE ON FUNCTION public.ohlc_symbols() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ohlc_timeframes(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ohlc_symbols() TO service_role;
GRANT EXECUTE ON FUNCTION public.ohlc_timeframes(text) TO service_role;
create or replace function public.ohlc_symbols()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select distinct symbol from public.ohlc_data where symbol is not null order by 1
$$;

create or replace function public.ohlc_timeframes(_symbol text)
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select distinct timeframe from public.ohlc_data
  where symbol = _symbol and timeframe is not null
  order by 1
$$;

revoke all on function public.ohlc_symbols() from anon, authenticated;
revoke all on function public.ohlc_timeframes(text) from anon, authenticated;
grant execute on function public.ohlc_symbols() to service_role;
grant execute on function public.ohlc_timeframes(text) to service_role;
-- "I placed this": when the trader says a saved read or a typed trade was really
-- placed. Null means not marked. Only placed trades are closed automatically
-- from stored prices; everything else still waits for the trader.
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS placed_at timestamptz;

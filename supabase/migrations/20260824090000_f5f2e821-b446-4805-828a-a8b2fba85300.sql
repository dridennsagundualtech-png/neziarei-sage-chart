ALTER TABLE public.premium_access
  ADD COLUMN IF NOT EXISTS market_data_enabled boolean NOT NULL DEFAULT false;
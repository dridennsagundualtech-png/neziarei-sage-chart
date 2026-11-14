-- "Require a proven edge" (Settings, owner only). True keeps a Den result's
-- "Ready" behind a measured edge. False lets "Ready" light on the rules alone;
-- the result then says no edge is proven.
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS require_edge boolean NOT NULL DEFAULT true;

-- Two optional guard rails next to the daily loss limit (Settings › Risk). Both
-- are off at 0. max_trades_per_day counts trades marked "I placed this" today;
-- pause_after_loss_min is how long to wait after a trade closes as a loss.
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS max_trades_per_day integer NOT NULL DEFAULT 0;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS pause_after_loss_min integer NOT NULL DEFAULT 0;

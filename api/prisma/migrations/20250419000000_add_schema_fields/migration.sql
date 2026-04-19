-- Add slug to cities (applied manually, backfilled 2026-04-19)
ALTER TABLE cities ADD COLUMN IF NOT EXISTS slug TEXT DEFAULT '' NOT NULL;
UPDATE cities SET slug = lower(regexp_replace(trim(name), '\s+', '-', 'g')) WHERE slug = '';
ALTER TABLE cities ADD CONSTRAINT IF NOT EXISTS cities_slug_key UNIQUE (slug);

-- Add address and search_aliases to fns_offices
ALTER TABLE fns_offices ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE fns_offices ADD COLUMN IF NOT EXISTS search_aliases TEXT;
ALTER TABLE fns_offices ADD CONSTRAINT IF NOT EXISTS fns_offices_code_key UNIQUE (code);

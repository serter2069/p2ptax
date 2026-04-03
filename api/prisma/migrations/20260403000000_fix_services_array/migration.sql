-- Fix onboarding bug: split comma-joined service strings into proper arrays
-- Profiles created via onboarding before this fix had services stored as
-- a single-element array containing a comma-separated string, e.g.:
--   ["Декларации 3-НДФЛ, Налоговые споры, Оптимизация налогов"]
-- This migration splits them into proper multi-element arrays.
UPDATE "specialist_profiles"
SET services = string_to_array(services[1], ', ')
WHERE array_length(services, 1) = 1
  AND services[1] LIKE '%,%';

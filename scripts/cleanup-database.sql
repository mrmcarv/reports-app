/**
 * Database Cleanup Script for Testing
 *
 * This script completely resets all work order data in Supabase.
 * Use this to clean up test data and start fresh.
 *
 * CAUTION: This will delete ALL work order data!
 * Only run this in development/testing environments.
 */

-- Show counts BEFORE cleanup
DO $$
BEGIN
  RAISE NOTICE '=== BEFORE CLEANUP ===';
  RAISE NOTICE 'work_orders: %', (SELECT COUNT(*) FROM work_orders);
  RAISE NOTICE 'form_submissions: %', (SELECT COUNT(*) FROM form_submissions);
  RAISE NOTICE 'battery_swaps: %', (SELECT COUNT(*) FROM battery_swaps);
  RAISE NOTICE 'parts_used: %', (SELECT COUNT(*) FROM parts_used);
  RAISE NOTICE '====================';
END $$;

-- Delete all data (in correct order due to foreign keys)
DELETE FROM parts_used;
DELETE FROM battery_swaps;
DELETE FROM form_submissions;
DELETE FROM work_orders;

-- Reset auto-increment sequences to 1
ALTER SEQUENCE parts_used_id_seq RESTART WITH 1;
ALTER SEQUENCE battery_swaps_id_seq RESTART WITH 1;
ALTER SEQUENCE form_submissions_id_seq RESTART WITH 1;
ALTER SEQUENCE work_orders_id_seq RESTART WITH 1;

-- Show counts AFTER cleanup
DO $$
BEGIN
  RAISE NOTICE '=== AFTER CLEANUP ===';
  RAISE NOTICE 'work_orders: %', (SELECT COUNT(*) FROM work_orders);
  RAISE NOTICE 'form_submissions: %', (SELECT COUNT(*) FROM form_submissions);
  RAISE NOTICE 'battery_swaps: %', (SELECT COUNT(*) FROM battery_swaps);
  RAISE NOTICE 'parts_used: %', (SELECT COUNT(*) FROM parts_used);
  RAISE NOTICE '=====================';
  RAISE NOTICE '✅ Database cleanup complete!';
END $$;

-- Verification query (shows structure is intact but data is gone)
SELECT
  table_name,
  (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
FROM (
  SELECT
    table_name,
    table_schema,
    query_to_xml(format('select count(*) as cnt from %I.%I', table_schema, table_name), false, true, '') as xml_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('work_orders', 'form_submissions', 'battery_swaps', 'parts_used')
) t
ORDER BY table_name;

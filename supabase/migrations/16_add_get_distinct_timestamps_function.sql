-- Function to efficiently get the last N distinct crawler timestamps
-- This is needed for the storage-trends API to avoid fetching thousands of records
-- just to find unique timestamps

CREATE OR REPLACE FUNCTION get_last_n_crawl_timestamps(n integer DEFAULT 6)
RETURNS TABLE(ts bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT pnode_history.ts
  FROM pnode_history
  ORDER BY pnode_history.ts DESC
  LIMIT n;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_last_n_crawl_timestamps IS
'Returns the last N distinct crawler run timestamps from pnode_history.
This is much more efficient than fetching thousands of records to find distinct timestamps.
Default: last 6 crawler runs for sparkline display.';

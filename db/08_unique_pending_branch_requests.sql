-- A branch may have one pending request per action. Different actions (for
-- example deactivation and deletion) remain independently requestable.
WITH duplicated AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY pharmacy_id, action ORDER BY created_at, id) AS position
  FROM pharmacy_change_requests
  WHERE status = 'PENDING'
)
UPDATE pharmacy_change_requests
SET status = 'REJECTED', reviewed_at = CURRENT_TIMESTAMP
WHERE id IN (SELECT id FROM duplicated WHERE position > 1);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_branch_request
  ON pharmacy_change_requests (pharmacy_id, action)
  WHERE status = 'PENDING';

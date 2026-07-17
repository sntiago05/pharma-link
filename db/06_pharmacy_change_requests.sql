-- Approval queue for branch-management changes proposed by matrix operators.
CREATE TABLE IF NOT EXISTS pharmacy_change_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id),
  requested_by INTEGER NOT NULL REFERENCES users(id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('ACTIVATE', 'DEACTIVATE', 'DELETE')),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_change_requests_pending
  ON pharmacy_change_requests (status, created_at DESC);

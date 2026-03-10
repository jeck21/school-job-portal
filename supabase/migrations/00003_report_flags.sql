CREATE TABLE report_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('broken_link', 'filled_expired', 'other')),
  details TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  resolved BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_report_flags_job_id ON report_flags(job_id);
CREATE INDEX idx_report_flags_unresolved ON report_flags(resolved) WHERE resolved = false;

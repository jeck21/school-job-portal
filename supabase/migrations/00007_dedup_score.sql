-- Add dedup_score to job_sources for auditing cross-source dedup decisions.
-- Records the Dice coefficient score at which a job was linked to an existing record.
-- NULL means the job_sources entry is a primary source (not a dedup link).
ALTER TABLE job_sources ADD COLUMN dedup_score REAL;

-- Index for quickly finding all dedup links and auditing by score
CREATE INDEX idx_job_sources_dedup_score ON job_sources (dedup_score) WHERE dedup_score IS NOT NULL;

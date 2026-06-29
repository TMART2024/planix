-- 0002_add_audit_log.sql
-- Immutable, insert-only audit log.
--
-- Rule (CLAUDE.md #6): every significant action creates an audit entry; the log
-- is immutable. No code path may UPDATE or DELETE audit records. We enforce this
-- at the database level with a rule that rejects UPDATE/DELETE outright, in
-- addition to withholding those grants from the application role at deploy time.

-- migrate

CREATE TABLE audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  entity_type   VARCHAR(100) NOT NULL,   -- 'task', 'project', 'user', etc.
  entity_id     UUID NOT NULL,
  action        VARCHAR(100) NOT NULL,   -- 'create', 'update', 'delete', 'login', etc.
  actor_id      UUID,                    -- NULL for system actions
  old_value     JSONB,
  new_value     JSONB,
  meta          JSONB                    -- reason, ip address, user agent, etc.
);

CREATE INDEX idx_audit_log_entity ON audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_log_actor ON audit_log (actor_id);
CREATE INDEX idx_audit_log_created_at ON audit_log (created_at);

-- Belt-and-suspenders immutability: block UPDATE and DELETE at the table level.
CREATE RULE audit_log_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;

-- rollback

DROP RULE IF EXISTS audit_log_no_delete ON audit_log;
DROP RULE IF EXISTS audit_log_no_update ON audit_log;
DROP TABLE IF EXISTS audit_log;

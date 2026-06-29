-- 0001_initial_schema.sql
-- Planix core organizational + project data model.
--
-- Non-negotiable rules enforced here (see CLAUDE.md / ARCHITECTURE.md):
--   * Every datetime column is TIMESTAMPTZ (UTC). No TIMESTAMP WITHOUT TIME ZONE.
--   * Every primary table carries deleted_at + deleted_by for soft delete.
--   * All durations are INTEGER minutes. No INTERVAL, no FLOAT, no hours.
--   * Primary keys are UUID via gen_random_uuid().

-- migrate

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- provides gen_random_uuid()

-- Shared trigger function: keep updated_at honest on every UPDATE.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- Organization
-- ---------------------------------------------------------------------------
CREATE TABLE organization (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(200) NOT NULL,
  slug        VARCHAR(120) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  UUID,
  updated_by  UUID,
  deleted_at  TIMESTAMPTZ,
  deleted_by  UUID
);
CREATE UNIQUE INDEX uq_organization_slug ON organization (slug) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_organization_updated_at
  BEFORE UPDATE ON organization
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Department  (a business unit within an organization)
-- ---------------------------------------------------------------------------
CREATE TABLE department (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organization (id),
  name             VARCHAR(200) NOT NULL,
  slug             VARCHAR(120) NOT NULL,
  description      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by       UUID,
  updated_by       UUID,
  deleted_at       TIMESTAMPTZ,
  deleted_by       UUID
);
CREATE INDEX idx_department_org ON department (organization_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_department_org_slug ON department (organization_id, slug) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_department_updated_at
  BEFORE UPDATE ON department
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Role  (RBAC role definitions, scoped to an organization)
-- ---------------------------------------------------------------------------
CREATE TABLE role (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organization (id),
  name             VARCHAR(100) NOT NULL,
  slug             VARCHAR(80) NOT NULL,
  description      TEXT,
  -- Coarse permission set as JSONB for Phase 0; a granular permission table
  -- arrives in a later phase when the authorization model is finalized.
  permissions      JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by       UUID,
  updated_by       UUID,
  deleted_at       TIMESTAMPTZ,
  deleted_by       UUID
);
CREATE UNIQUE INDEX uq_role_org_slug ON role (organization_id, slug) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_role_updated_at
  BEFORE UPDATE ON role
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- User
--   user_type distinguishes internal (Azure AD SSO) from customer-portal
--   (Planix-managed email/password) accounts.
--   azure_ad_oid is the Azure AD object id for internal users (NULL otherwise).
--   password_hash is set only for portal users (NULL for internal users).
-- ---------------------------------------------------------------------------
CREATE TABLE app_user (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organization (id),
  user_type        VARCHAR(20) NOT NULL DEFAULT 'internal'
                     CHECK (user_type IN ('internal', 'portal')),
  email            VARCHAR(320) NOT NULL,
  display_name     VARCHAR(200) NOT NULL,
  azure_ad_oid     VARCHAR(100),
  password_hash    TEXT,
  -- IANA time zone used to convert UTC -> local at the display layer.
  timezone         VARCHAR(64) NOT NULL DEFAULT 'America/Chicago',
  locale           VARCHAR(10) NOT NULL DEFAULT 'en',
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by       UUID,
  updated_by       UUID,
  deleted_at       TIMESTAMPTZ,
  deleted_by       UUID,
  -- Internal users authenticate via Azure AD; portal users via password.
  CONSTRAINT chk_user_auth CHECK (
    (user_type = 'internal' AND azure_ad_oid IS NOT NULL) OR
    (user_type = 'portal'   AND password_hash IS NOT NULL)
  )
);
CREATE UNIQUE INDEX uq_user_org_email ON app_user (organization_id, lower(email)) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_user_azure_oid ON app_user (azure_ad_oid) WHERE azure_ad_oid IS NOT NULL AND deleted_at IS NULL;

CREATE TRIGGER trg_app_user_updated_at
  BEFORE UPDATE ON app_user
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- user_department  (users can belong to multiple departments)
-- ---------------------------------------------------------------------------
CREATE TABLE user_department (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES app_user (id),
  department_id  UUID NOT NULL REFERENCES department (id),
  is_primary     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by     UUID,
  deleted_at     TIMESTAMPTZ,
  deleted_by     UUID
);
CREATE UNIQUE INDEX uq_user_department ON user_department (user_id, department_id) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- user_role  (role assignments, optionally scoped to a department)
-- ---------------------------------------------------------------------------
CREATE TABLE user_role (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES app_user (id),
  role_id        UUID NOT NULL REFERENCES role (id),
  department_id  UUID REFERENCES department (id),  -- NULL = org-wide assignment
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by     UUID,
  deleted_at     TIMESTAMPTZ,
  deleted_by     UUID
);
CREATE UNIQUE INDEX uq_user_role_scope
  ON user_role (user_id, role_id, COALESCE(department_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Project
-- ---------------------------------------------------------------------------
CREATE TABLE project (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id             UUID NOT NULL REFERENCES organization (id),
  department_id               UUID NOT NULL REFERENCES department (id),
  name                        VARCHAR(300) NOT NULL,
  code                        VARCHAR(40),
  description                 TEXT,
  status                      VARCHAR(30) NOT NULL DEFAULT 'not_started'
                                CHECK (status IN ('not_started','in_progress','at_risk','blocked','on_hold','complete')),
  -- Schedule (UTC). Working-time math is done against the project calendar,
  -- never wall-clock; these columns are the stored anchors only.
  planned_start_at            TIMESTAMPTZ,
  planned_finish_at           TIMESTAMPTZ,
  actual_start_at             TIMESTAMPTZ,
  actual_finish_at            TIMESTAMPTZ,
  estimated_duration_minutes  INTEGER NOT NULL DEFAULT 0,
  actual_duration_minutes     INTEGER NOT NULL DEFAULT 0,
  percent_complete            INTEGER NOT NULL DEFAULT 0 CHECK (percent_complete BETWEEN 0 AND 100),
  owner_id                    UUID REFERENCES app_user (id),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by                  UUID,
  updated_by                  UUID,
  deleted_at                  TIMESTAMPTZ,
  deleted_by                  UUID
);
CREATE INDEX idx_project_org ON project (organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_project_department ON project (department_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_project_org_code ON project (organization_id, code) WHERE code IS NOT NULL AND deleted_at IS NULL;

CREATE TRIGGER trg_project_updated_at
  BEFORE UPDATE ON project
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Phase  (optional grouping of tasks within a project)
-- ---------------------------------------------------------------------------
CREATE TABLE phase (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         UUID NOT NULL REFERENCES project (id),
  name               VARCHAR(300) NOT NULL,
  description        TEXT,
  sort_order         INTEGER NOT NULL DEFAULT 0,
  planned_start_at   TIMESTAMPTZ,
  planned_finish_at  TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by         UUID,
  updated_by         UUID,
  deleted_at         TIMESTAMPTZ,
  deleted_by         UUID
);
CREATE INDEX idx_phase_project ON phase (project_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_phase_updated_at
  BEFORE UPDATE ON phase
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Task
--   parent_id self-reference supports unlimited subtask nesting.
--   phase_id optional. All durations in INTEGER minutes.
-- ---------------------------------------------------------------------------
CREATE TABLE task (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id                  UUID NOT NULL REFERENCES project (id),
  phase_id                    UUID REFERENCES phase (id),
  parent_id                   UUID REFERENCES task (id),
  name                        VARCHAR(500) NOT NULL,
  description                 TEXT,
  status                      VARCHAR(30) NOT NULL DEFAULT 'not_started'
                                CHECK (status IN ('not_started','in_progress','at_risk','blocked','on_hold','complete')),
  priority                    VARCHAR(20) NOT NULL DEFAULT 'medium'
                                CHECK (priority IN ('low','medium','high','critical')),
  is_milestone                BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order                  INTEGER NOT NULL DEFAULT 0,
  planned_start_at            TIMESTAMPTZ,
  planned_finish_at           TIMESTAMPTZ,
  actual_start_at             TIMESTAMPTZ,
  actual_finish_at            TIMESTAMPTZ,
  estimated_duration_minutes  INTEGER NOT NULL DEFAULT 0,
  actual_duration_minutes     INTEGER NOT NULL DEFAULT 0,
  remaining_duration_minutes  INTEGER,
  percent_complete            INTEGER NOT NULL DEFAULT 0 CHECK (percent_complete BETWEEN 0 AND 100),
  assignee_id                 UUID REFERENCES app_user (id),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by                  UUID,
  updated_by                  UUID,
  deleted_at                  TIMESTAMPTZ,
  deleted_by                  UUID
);
CREATE INDEX idx_task_project ON task (project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_task_phase ON task (phase_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_task_parent ON task (parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_task_assignee ON task (assignee_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_task_updated_at
  BEFORE UPDATE ON task
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- rollback

DROP TABLE IF EXISTS task;
DROP TABLE IF EXISTS phase;
DROP TABLE IF EXISTS project;
DROP TABLE IF EXISTS user_role;
DROP TABLE IF EXISTS user_department;
DROP TABLE IF EXISTS app_user;
DROP TABLE IF EXISTS role;
DROP TABLE IF EXISTS department;
DROP TABLE IF EXISTS organization;
DROP FUNCTION IF EXISTS set_updated_at();

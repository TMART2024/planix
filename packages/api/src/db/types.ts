import type { ColumnType, Generated, JSONColumnType } from 'kysely';

/**
 * Kysely table interfaces. These describe rows as the database sees them.
 *
 * Conventions:
 *   - `Timestamp` columns map to PostgreSQL TIMESTAMPTZ and surface as Date.
 *   - `Generated<T>` marks DB-defaulted columns (id, created_at, ...).
 *   - All durations are integer minutes.
 */

type Timestamp = ColumnType<Date, Date | string | undefined, Date | string>;

export interface OrganizationTable {
  id: Generated<string>;
  name: string;
  slug: string;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: Timestamp | null;
  deleted_by: string | null;
}

export interface DepartmentTable {
  id: Generated<string>;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: Timestamp | null;
  deleted_by: string | null;
}

export interface RoleTable {
  id: Generated<string>;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: JSONColumnType<string[], string, string>;
  is_system: Generated<boolean>;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: Timestamp | null;
  deleted_by: string | null;
}

export interface AppUserTable {
  id: Generated<string>;
  organization_id: string;
  user_type: 'internal' | 'portal';
  email: string;
  display_name: string;
  azure_ad_oid: string | null;
  password_hash: string | null;
  timezone: Generated<string>;
  locale: Generated<string>;
  is_active: Generated<boolean>;
  last_login_at: Timestamp | null;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: Timestamp | null;
  deleted_by: string | null;
}

export interface UserDepartmentTable {
  id: Generated<string>;
  user_id: string;
  department_id: string;
  is_primary: Generated<boolean>;
  created_at: Generated<Timestamp>;
  created_by: string | null;
  deleted_at: Timestamp | null;
  deleted_by: string | null;
}

export interface UserRoleTable {
  id: Generated<string>;
  user_id: string;
  role_id: string;
  department_id: string | null;
  created_at: Generated<Timestamp>;
  created_by: string | null;
  deleted_at: Timestamp | null;
  deleted_by: string | null;
}

export interface ProjectTable {
  id: Generated<string>;
  organization_id: string;
  department_id: string;
  name: string;
  code: string | null;
  description: string | null;
  status: Generated<string>;
  planned_start_at: Timestamp | null;
  planned_finish_at: Timestamp | null;
  actual_start_at: Timestamp | null;
  actual_finish_at: Timestamp | null;
  estimated_duration_minutes: Generated<number>;
  actual_duration_minutes: Generated<number>;
  percent_complete: Generated<number>;
  owner_id: string | null;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: Timestamp | null;
  deleted_by: string | null;
}

export interface PhaseTable {
  id: Generated<string>;
  project_id: string;
  name: string;
  description: string | null;
  sort_order: Generated<number>;
  planned_start_at: Timestamp | null;
  planned_finish_at: Timestamp | null;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: Timestamp | null;
  deleted_by: string | null;
}

export interface TaskTable {
  id: Generated<string>;
  project_id: string;
  phase_id: string | null;
  parent_id: string | null;
  name: string;
  description: string | null;
  status: Generated<string>;
  priority: Generated<string>;
  is_milestone: Generated<boolean>;
  sort_order: Generated<number>;
  planned_start_at: Timestamp | null;
  planned_finish_at: Timestamp | null;
  actual_start_at: Timestamp | null;
  actual_finish_at: Timestamp | null;
  estimated_duration_minutes: Generated<number>;
  actual_duration_minutes: Generated<number>;
  remaining_duration_minutes: number | null;
  percent_complete: Generated<number>;
  assignee_id: string | null;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: Timestamp | null;
  deleted_by: string | null;
}

export interface AuditLogTable {
  id: Generated<string>;
  created_at: Generated<Timestamp>;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id: string | null;
  old_value: JSONColumnType<Record<string, unknown> | null, string | null, string | null>;
  new_value: JSONColumnType<Record<string, unknown> | null, string | null, string | null>;
  meta: JSONColumnType<Record<string, unknown> | null, string | null, string | null>;
}

/** The full database schema as seen by Kysely. */
export interface Database {
  organization: OrganizationTable;
  department: DepartmentTable;
  role: RoleTable;
  app_user: AppUserTable;
  user_department: UserDepartmentTable;
  user_role: UserRoleTable;
  project: ProjectTable;
  phase: PhaseTable;
  task: TaskTable;
  audit_log: AuditLogTable;
}

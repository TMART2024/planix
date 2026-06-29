/**
 * Domain types shared between the API and web packages.
 * These mirror the database schema (see database/migrations/0001_initial_schema.sql)
 * but are the transport/UI shape, not the raw row type.
 */

export type UserType = 'internal' | 'portal';

export type EntityStatus =
  | 'not_started'
  | 'in_progress'
  | 'at_risk'
  | 'blocked'
  | 'on_hold'
  | 'complete';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

export interface Department {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Role {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  permissions: string[];
  isSystem: boolean;
}

export interface User {
  id: string;
  organizationId: string;
  userType: UserType;
  email: string;
  displayName: string;
  /** IANA time zone; UTC values from the API convert to this at display time. */
  timezone: string;
  locale: string;
  isActive: boolean;
}

export interface Project {
  id: string;
  organizationId: string;
  departmentId: string;
  name: string;
  code: string | null;
  status: EntityStatus;
  /** ISO 8601 UTC strings. The UI converts to the user's time zone. */
  plannedStartAt: string | null;
  plannedFinishAt: string | null;
  estimatedDurationMinutes: number;
  percentComplete: number;
  ownerId: string | null;
}

export interface Task {
  id: string;
  projectId: string;
  phaseId: string | null;
  parentId: string | null;
  name: string;
  status: EntityStatus;
  priority: TaskPriority;
  isMilestone: boolean;
  /** ISO 8601 UTC strings. */
  plannedStartAt: string | null;
  plannedFinishAt: string | null;
  estimatedDurationMinutes: number;
  percentComplete: number;
  assigneeId: string | null;
}

/** JWT claim shape issued by the Planix API for both internal and portal sessions. */
export interface AuthClaims {
  sub: string;            // app_user.id
  org: string;            // organization_id
  userType: UserType;
  email: string;
  /** Present only for portal users — scopes all queries to one customer. */
  customerId?: string;
}

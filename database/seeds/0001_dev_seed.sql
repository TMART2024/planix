-- 0001_dev_seed.sql
-- Development-only seed data. Never run against production.
-- Establishes CHR Solutions, its three business units, baseline roles, and an
-- internal admin user. Idempotent via ON CONFLICT on the unique slug indexes.

INSERT INTO organization (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'CHR Solutions', 'chr-solutions')
ON CONFLICT DO NOTHING;

INSERT INTO department (organization_id, name, slug, description) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Managed IT Services and Cybersecurity', 'managed-it', 'Managed IT and security operations'),
  ('00000000-0000-0000-0000-000000000001', 'Fiber Engineering and Construction Management', 'fiber-construction', 'Fiber engineering and construction'),
  ('00000000-0000-0000-0000-000000000001', 'Software Development and Customer Activations', 'software-activations', 'Software dev and customer activations')
ON CONFLICT DO NOTHING;

INSERT INTO role (organization_id, name, slug, permissions, is_system) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Administrator', 'admin', '["*"]'::jsonb, TRUE),
  ('00000000-0000-0000-0000-000000000001', 'Project Manager', 'project-manager', '["project:*","task:*"]'::jsonb, TRUE),
  ('00000000-0000-0000-0000-000000000001', 'Team Member', 'team-member', '["task:read","task:update"]'::jsonb, TRUE),
  ('00000000-0000-0000-0000-000000000001', 'Customer', 'customer', '["portal:read"]'::jsonb, TRUE)
ON CONFLICT DO NOTHING;

-- Internal admin (Azure AD). azure_ad_oid is a placeholder for local dev.
INSERT INTO app_user (organization_id, user_type, email, display_name, azure_ad_oid, timezone)
VALUES ('00000000-0000-0000-0000-000000000001', 'internal', 'trent.martin@chrsolutions.com', 'Trent Martin', 'dev-oid-trent-martin', 'America/Chicago')
ON CONFLICT DO NOTHING;

-- Contact data belongs to patient profiles, not generic user accounts.
DROP INDEX IF EXISTS idx_users_document_unique;
ALTER TABLE users DROP COLUMN IF EXISTS document;
ALTER TABLE users DROP COLUMN IF EXISTS phone;

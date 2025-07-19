
-- This migration file has been intentionally cleared to remove a hardcoded password.
-- The initial super admin user should be created manually through the Supabase dashboard
-- or via a secure, one-time script using environment variables for the password.

-- 1. Go to your Supabase Project Dashboard.
-- 2. Navigate to "Authentication" -> "Users".
-- 3. Click "Create user" and create your admin user.
-- 4. Navigate to "Table Editor" -> "user_roles" table.
-- 5. Click "Insert row", add the new user's ID, and set the role to "super_admin".

-- This manual process ensures your admin credentials are never committed to the codebase.

SELECT 'Migration intentionally cleared for security reasons.';

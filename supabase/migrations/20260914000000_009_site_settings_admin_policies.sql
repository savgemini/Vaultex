/*
# Allow admin site settings writes through RLS

## Overview
Adds a site_settings policy so authenticated admin users can create/update
and manage the single site_settings row used by the admin settings page and
shared wallet modal text.
*/

DROP POLICY IF EXISTS "admin_manage_site_settings" ON site_settings;
CREATE POLICY "admin_manage_site_settings"
  ON site_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

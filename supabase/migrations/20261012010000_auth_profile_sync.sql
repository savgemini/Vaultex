-- Keep the public profile directory in sync with Supabase Auth accounts.
CREATE OR REPLACE FUNCTION public.create_profile_for_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, country, phone, account_status, verification_level)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'country', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    'pending_verification',
    'unverified'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_profile_for_auth_user();

INSERT INTO public.profiles (id, email, full_name, country, phone, account_status, verification_level)
SELECT
  auth_user.id,
  COALESCE(auth_user.email, ''),
  COALESCE(auth_user.raw_user_meta_data ->> 'full_name', ''),
  COALESCE(auth_user.raw_user_meta_data ->> 'country', ''),
  COALESCE(auth_user.raw_user_meta_data ->> 'phone', ''),
  'pending_verification',
  'unverified'
FROM auth.users AS auth_user
LEFT JOIN public.profiles AS profile ON profile.id = auth_user.id
WHERE profile.id IS NULL
ON CONFLICT (id) DO NOTHING;
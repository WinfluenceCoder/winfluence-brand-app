-- Manual external Supabase fix for BrandApp self-registration.
-- Apply this in the existing rssnbsduduboxlrvpodw project if /auth/v1/signup
-- fails with: Database error saving new user.
--
-- Root cause: the previous trigger inserted a new public.brands row and only
-- handled conflicts on user_id. If a brand already existed with the same
-- e_mail_address (for example pre-created with a moderator user_id), the
-- e_mail_address UNIQUE constraint aborted Auth signup.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(NEW.email));
  v_email_domain text := split_part(lower(trim(NEW.email)), '@', 2);
  v_unique_domain text;
  v_rows_updated integer := 0;
BEGIN
  IF v_email IS NULL OR v_email = '' THEN
    RETURN NEW;
  END IF;

  v_unique_domain := COALESCE(NULLIF(v_email_domain, ''), 'brand') || ':' || NEW.id::text;

  -- Invited or pre-created brands may already have this email and a placeholder
  -- user_id. For signup, email ownership is the deciding match.
  UPDATE public.brands AS b
  SET
    user_id = NEW.id,
    e_mail_address = v_email,
    updated_at = now()
  WHERE lower(b.e_mail_address) = v_email;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  IF v_rows_updated > 0 THEN
    RETURN NEW;
  END IF;

  -- Pure self-registration: create the minimal valid brand row.
  INSERT INTO public.brands (user_id, e_mail_address, domain)
  VALUES (NEW.id, v_email, v_unique_domain)
  ON CONFLICT (e_mail_address) DO UPDATE
  SET
    user_id = EXCLUDED.user_id,
    updated_at = now();

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
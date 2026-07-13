-- ============ ENUM & ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'viewer');

CREATE TABLE public.user_roles (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  PRIMARY KEY (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.brands (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  domain text NOT NULL UNIQUE,
  brand_name text,
  brand_pitch text,
  hashtags text,
  linkedin_url text UNIQUE,
  banner_url text,
  logo_url text,
  insta_url text UNIQUE,
  youtube_url text UNIQUE,
  tiktok_url text UNIQUE,
  legal_name text UNIQUE,
  mwst_nr text UNIQUE,
  billing_address_to text,
  billing_address_street text,
  billing_address_nr int,
  billing_address_zip int,
  billing_address_city text,
  e_mail_address text NOT NULL UNIQUE,
  first_name text,
  last_name text,
  is_male boolean,
  is_female boolean,
  job_title text,
  user_linkedin_url text UNIQUE,
  user_foto_url text,
  mobile text UNIQUE,
  sales_rep text,
  status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brands_mwst_format CHECK (mwst_nr IS NULL OR mwst_nr ~ '^CHE-\d{3}\.\d{3}\.\d{3}$')
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brands TO authenticated;
GRANT ALL ON public.brands TO service_role;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand owner select" ON public.brands FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor') OR public.has_role(auth.uid(),'viewer'));
CREATE POLICY "brand owner update" ON public.brands FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "admin/editor insert brands" ON public.brands FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "admin delete brands" ON public.brands FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER brands_updated_at BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.campaigns (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  brand_id bigint NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  brand_name text,
  brand_logo_url text,
  campaign_visual_url text,
  name text NOT NULL,
  product text,
  goal text NOT NULL,
  type text,
  targetgroup text,
  key_message text,
  briefing text,
  hashtags text,
  link_list text,
  post_type text,
  requirements text,
  target_url text,
  coupon text,
  barter_order_url text,
  barter_order_coupon text,
  start timestamptz,
  ende timestamptz,
  apply_till timestamptz,
  budget int,
  barter_value int,
  status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand own campaigns select" ON public.campaigns FOR SELECT TO authenticated
  USING (
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'editor')
    OR public.has_role(auth.uid(),'viewer')
  );
CREATE POLICY "brand own campaigns insert" ON public.campaigns FOR INSERT TO authenticated
  WITH CHECK (
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'editor')
  );
CREATE POLICY "brand own campaigns update" ON public.campaigns FOR UPDATE TO authenticated
  USING (
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'editor')
  )
  WITH CHECK (
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'editor')
  );
CREATE POLICY "admin delete campaigns" ON public.campaigns FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.creators (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  e_mail_address text NOT NULL UNIQUE,
  mobile text UNIQUE,
  nick_name text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  is_male boolean NOT NULL DEFAULT false,
  is_female boolean NOT NULL DEFAULT false,
  linkedin_url text UNIQUE,
  foto_url text,
  insta_url text UNIQUE,
  youtube_url text UNIQUE,
  tiktok_url text UNIQUE,
  is_company boolean,
  company_legal_name text,
  address_street text,
  address_nr int,
  address_zip int,
  address_city text,
  status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creators TO authenticated;
GRANT ALL ON public.creators TO service_role;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creators role select" ON public.creators FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor') OR public.has_role(auth.uid(),'viewer'));
CREATE POLICY "creators role insert" ON public.creators FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "creators role update" ON public.creators FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "creators admin delete" ON public.creators FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER creators_updated_at BEFORE UPDATE ON public.creators
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.collabs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  campaign_id bigint NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creator_id bigint NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  post_type text,
  price int,
  pitch text,
  kpi_list text,
  media_files_url_list text,
  link_list text,
  creator_remark text,
  brand_rating int,
  brand_feedback text,
  status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collabs TO authenticated;
GRANT ALL ON public.collabs TO service_role;
ALTER TABLE public.collabs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collabs role select" ON public.collabs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor') OR public.has_role(auth.uid(),'viewer'));
CREATE POLICY "collabs role insert" ON public.collabs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "collabs role update" ON public.collabs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "collabs admin delete" ON public.collabs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER collabs_updated_at BEFORE UPDATE ON public.collabs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  email_domain text;
  unique_domain text;
BEGIN
  email_domain := split_part(NEW.email, '@', 2);
  unique_domain := email_domain || ':' || NEW.id::text;
  INSERT INTO public.brands (user_id, e_mail_address, domain)
  VALUES (NEW.id, NEW.email, unique_domain)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
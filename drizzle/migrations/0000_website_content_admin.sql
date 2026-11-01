CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TABLE public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role public.app_role NOT NULL, UNIQUE(user_id,role));
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY roles_read_own ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;
CREATE TABLE public.admin_bootstrap (id boolean PRIMARY KEY DEFAULT true CHECK(id), completed_at timestamptz NOT NULL DEFAULT now(), user_id uuid NOT NULL);
GRANT ALL ON public.admin_bootstrap TO service_role;
ALTER TABLE public.admin_bootstrap ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.bootstrap_admin(_user_id uuid, _email text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN PERFORM pg_advisory_xact_lock(71320626); IF EXISTS(SELECT 1 FROM public.admin_bootstrap) OR EXISTS(SELECT 1 FROM public.user_roles WHERE role='admin') THEN RETURN false; END IF; IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=_user_id AND lower(email)=lower(_email) AND email_confirmed_at IS NOT NULL) THEN RAISE EXCEPTION 'Confirmed matching account required'; END IF; INSERT INTO public.user_roles(user_id,role) VALUES(_user_id,'admin'); INSERT INTO public.admin_bootstrap(id,user_id) VALUES(true,_user_id); RETURN true; END $$;
REVOKE ALL ON FUNCTION public.bootstrap_admin(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_admin(uuid,text) TO service_role;
CREATE TABLE public.site_content (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kind text NOT NULL CHECK(kind IN ('announcement','release','event')),
 title text NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 160), summary text NOT NULL DEFAULT '' CHECK(length(summary)<=500), body text NOT NULL DEFAULT '' CHECK(length(body)<=50000), cover_path text,
 category text NOT NULL DEFAULT '一般' CHECK(length(category) BETWEEN 1 AND 60), status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')), pinned boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz,
 starts_at timestamptz, ends_at timestamptz, location text NOT NULL DEFAULT '', registration_url text NOT NULL DEFAULT '',
 CONSTRAINT published_has_date CHECK(status <> 'published' OR published_at IS NOT NULL),
 CONSTRAINT event_dates CHECK(kind <> 'event' OR (starts_at IS NOT NULL AND ends_at IS NOT NULL AND ends_at > starts_at)),
 CONSTRAINT registration_safe CHECK(registration_url='' OR registration_url ~ '^https?://'),
 CONSTRAINT cover_owned CHECK(cover_path IS NULL OR split_part(cover_path,'/',1)=id::text)
);
GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY content_public_read ON public.site_content FOR SELECT TO anon, authenticated USING(status='published' AND published_at<=now());
CREATE POLICY content_admin_read ON public.site_content FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE POLICY content_admin_insert ON public.site_content FOR INSERT TO authenticated WITH CHECK(public.has_role(auth.uid(),'admin'));
CREATE POLICY content_admin_update ON public.site_content FOR UPDATE TO authenticated USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));
CREATE POLICY content_admin_delete ON public.site_content FOR DELETE TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE INDEX content_public_order ON public.site_content(kind,status,pinned DESC,published_at DESC);
CREATE FUNCTION public.content_updated() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
CREATE TRIGGER content_updated BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION public.content_updated();
CREATE POLICY cover_admin_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='content-covers' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY cover_public_read ON storage.objects FOR SELECT TO anon, authenticated USING(bucket_id='content-covers' AND EXISTS(SELECT 1 FROM public.site_content c WHERE c.cover_path=name AND c.status='published' AND c.published_at<=now()));
CREATE POLICY cover_admin_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='content-covers' AND public.has_role(auth.uid(),'admin') AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp'));
CREATE POLICY cover_admin_update ON storage.objects FOR UPDATE TO authenticated USING(bucket_id='content-covers' AND public.has_role(auth.uid(),'admin')) WITH CHECK(bucket_id='content-covers' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY cover_admin_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id='content-covers' AND public.has_role(auth.uid(),'admin'));
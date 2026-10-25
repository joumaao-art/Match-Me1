-- VIA review data is private and temporary. No changes to existing tables or credit RPCs.
create table if not exists public.app_91d3436dfc_skill_requirement_cache (
 cache_key text primary key, requirements jsonb not null, expires_at timestamptz not null
);
create table if not exists public.app_91d3436dfc_skill_reviews (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 vacancy_id uuid not null references public.vacancies(id) on delete cascade,
 vacancy_revision timestamptz, allowed_skills text[] not null default '{}',
 created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '20 minutes'
);
alter table public.app_91d3436dfc_skill_requirement_cache enable row level security;
alter table public.app_91d3436dfc_skill_reviews enable row level security;
revoke all on public.app_91d3436dfc_skill_requirement_cache,public.app_91d3436dfc_skill_reviews from anon,authenticated;
create or replace function public.app_91d3436dfc_begin_skill_review(p_user uuid,p_job uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare result uuid; revision timestamptz;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,24));
 if not exists(select 1 from job_seeker_profiles where user_id=p_user) then raise exception 'Seeker profile required'; end if;
 select updated_at into revision from vacancies where id=p_job and status='open' and (expiration_date is null or expiration_date::date>=current_date);
 if not found then raise exception 'Vacancy unavailable'; end if;
 if (select count(*) from app_91d3436dfc_skill_reviews where user_id=p_user and created_at>now()-interval '1 minute')>=5 or
 (select count(*) from app_91d3436dfc_skill_reviews where user_id=p_user and created_at>now()-interval '1 day')>=30 then raise exception 'Review rate limit'; end if;
 delete from app_91d3436dfc_skill_reviews where created_at<now()-interval '1 day';
 delete from app_91d3436dfc_skill_requirement_cache where expires_at<now();
 insert into app_91d3436dfc_skill_reviews(user_id,vacancy_id,vacancy_revision) values(p_user,p_job,revision) returning id into result;
 return result;
end $$;
revoke all on function public.app_91d3436dfc_begin_skill_review(uuid,uuid) from public,anon,authenticated;
grant execute on function public.app_91d3436dfc_begin_skill_review(uuid,uuid) to service_role;
create or replace function public.app_91d3436dfc_normalize_skill(value text)
returns text language sql immutable set search_path=public as $$
 select case lower(regexp_replace(trim(normalize(value,NFKC)),'\s+',' ','g'))
 when 'react.js' then 'react' when 'reactjs' then 'react' when 'nodejs' then 'node.js' when 'node js' then 'node.js'
 when 'js' then 'javascript' when 'ts' then 'typescript' when 'postgres' then 'postgresql'
 when 'amazon web services' then 'aws' when 'ms excel' then 'excel' when 'microsoft excel' then 'excel'
 when 'ms office' then 'microsoft office' when 'search engine optimization' then 'seo' when 'customer support' then 'customer service'
 when 'إدارة المشاريع' then 'project management' when 'تحليل البيانات' then 'data analysis' when 'خدمة العملاء' then 'customer service'
 when 'المبيعات' then 'sales' when 'التواصل' then 'communication' when 'القيادة' then 'leadership'
 else lower(regexp_replace(trim(normalize(value,NFKC)),'\s+',' ','g')) end;
$$;
create or replace function public.app_91d3436dfc_confirm_skill_review(p_review uuid,p_selected text[],p_confirmed boolean)
returns text[] language plpgsql security definer set search_path=public as $$
declare review app_91d3436dfc_skill_reviews; current_skills text[]; merged text[]; uid uuid:=auth.uid();
begin
 if uid is null or p_confirmed is distinct from true then raise exception 'Explicit genuine-skills confirmation required'; end if;
 select * into review from app_91d3436dfc_skill_reviews where id=p_review and user_id=uid and expires_at>now();
 if not found then raise exception 'Review expired or unavailable'; end if;
 perform 1 from vacancies where id=review.vacancy_id and status='open' and (expiration_date is null or expiration_date::date>=current_date) and updated_at is not distinct from review.vacancy_revision for share;
 if not found then raise exception 'Vacancy changed. Review again.'; end if;
 if p_selected is null or cardinality(p_selected)=0 or cardinality(p_selected)>100 or exists(select 1 from unnest(p_selected) s where s is null or length(trim(s))=0 or length(s)>150 or not(s=any(review.allowed_skills))) then raise exception 'Invalid selected skills'; end if;
 select coalesce(skills,'{}') into strict current_skills from job_seeker_profiles where user_id=uid for update;
 select coalesce(array_agg(s order by pos),'{}') into merged from (
 select distinct on (app_91d3436dfc_normalize_skill(s)) s,pos from unnest(current_skills||p_selected) with ordinality x(s,pos)
 order by app_91d3436dfc_normalize_skill(s),pos) normalized;
 if cardinality(merged)>200 then raise exception 'Profile skill limit reached'; end if;
 update job_seeker_profiles set skills=merged,updated_at=clock_timestamp() where user_id=uid;
 return merged;
end $$;
revoke all on function public.app_91d3436dfc_confirm_skill_review(uuid,text[],boolean) from public,anon;
grant execute on function public.app_91d3436dfc_confirm_skill_review(uuid,text[],boolean) to authenticated;

-- Explicit CRM taxonomy equivalence; no profile data or existing table shape changes.
create or replace function public.app_91d3436dfc_normalize_skill(value text)
returns text language sql immutable set search_path=public as $$
 select case lower(regexp_replace(trim(normalize(value,NFKC)),'\s+',' ','g'))
 when 'crm' then 'customer relationship management'
 when 'react.js' then 'react' when 'reactjs' then 'react' when 'nodejs' then 'node.js' when 'node js' then 'node.js'
 when 'js' then 'javascript' when 'ts' then 'typescript' when 'postgres' then 'postgresql'
 when 'amazon web services' then 'aws' when 'ms excel' then 'excel' when 'microsoft excel' then 'excel'
 when 'ms office' then 'microsoft office' when 'search engine optimization' then 'seo' when 'customer support' then 'customer service'
 when 'إدارة المشاريع' then 'project management' when 'تحليل البيانات' then 'data analysis' when 'خدمة العملاء' then 'customer service'
 when 'المبيعات' then 'sales' when 'التواصل' then 'communication' when 'القيادة' then 'leadership'
 else lower(regexp_replace(trim(normalize(value,NFKC)),'\s+',' ','g')) end;
$$;

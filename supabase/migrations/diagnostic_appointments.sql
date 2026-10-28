-- Diagnóstico temporário: coleta metadados de appointments/publicação realtime/duplicados
create table if not exists public._diag (
  id bigserial primary key,
  k text not null,
  v jsonb
);

truncate table public._diag;

insert into public._diag (k, v)
select 'columns', jsonb_agg(x) from (
  select column_name, data_type, is_nullable, column_default
  from information_schema.columns
  where table_schema = 'public' and table_name = 'appointments'
  order by ordinal_position
) x;

insert into public._diag (k, v)
select 'constraints', jsonb_agg(x) from (
  select conname, pg_get_constraintdef(oid) as def
  from pg_constraint
  where conrelid = 'public.appointments'::regclass
) x;

insert into public._diag (k, v)
select 'indexes', jsonb_agg(x) from (
  select indexname, indexdef from pg_indexes
  where schemaname = 'public' and tablename = 'appointments'
) x;

insert into public._diag (k, v)
select 'triggers', jsonb_agg(x) from (
  select tgname, pg_get_triggerdef(oid) as def
  from pg_trigger
  where tgrelid = 'public.appointments'::regclass and not tgisinternal
) x;

insert into public._diag (k, v)
select 'publication', jsonb_agg(x) from (
  select pubname, schemaname, tablename from pg_publication_tables
  where pubname = 'supabase_realtime'
) x;

insert into public._diag (k, v)
select 'publication_list', jsonb_agg(x) from (
  select pubname from pg_publication
) x;

insert into public._diag (k, v)
select 'replident', jsonb_build_object(
  'appointments', (select relreplident::text from pg_class where oid = 'public.appointments'::regclass),
  'publication', (select current_setting('wal_level'))
);

-- duplicados reais (mesmo paciente + data + hora + dentista) em todo o histórico
insert into public._diag (k, v)
select 'dup_all', jsonb_agg(x) from (
  select coalesce(patient_cpf,'(null)') as cpf,
         upper(trim(patient_name)) as pname,
         appointment_date, appointment_time,
         coalesce(dentist_id,'(null)') as did,
         coalesce(dentist_name,'(null)') as dname,
         count(*) as n,
         jsonb_agg(jsonb_build_object(
            'id', id, 'proc', procedure, 'status', status,
            'created', created_at, 'notes', notes
         ) order by created_at) as rows
  from public.appointments
  group by 1,2,3,4,5,6
  having count(*) > 1
  order by appointment_date, appointment_time
) x;

-- contagem de duplicados por dia
insert into public._diag (k, v)
select 'dup_by_day', jsonb_agg(x) from (
  select appointment_date, count(*) as groups
  from (
    select appointment_date, coalesce(patient_cpf,'(null)') cpf, upper(trim(patient_name)) pname,
           appointment_time, coalesce(dentist_id,'(null)') did
    from public.appointments
    group by 1,2,3,4,5 having count(*) > 1
  ) d
  group by 1 order by 1
) x;

-- total geral e registros sem patient_cpf / sem dentist_id
insert into public._diag (k, v)
select 'counts', jsonb_build_object(
  'total', (select count(*) from public.appointments),
  'null_cpf', (select count(*) from public.appointments where patient_cpf is null),
  'null_dentist_id', (select count(*) from public.appointments where dentist_id is null),
  'future_rows', (select count(*) from public.appointments where appointment_date >= '2026-10-28'),
  'future_dup_groups', (select count(*) from (
     select 1 from public.appointments where appointment_date >= '2026-10-28'
     group by coalesce(patient_cpf,'(null)'), upper(trim(patient_name)), appointment_date, appointment_time, coalesce(dentist_id,'(null)')
     having count(*) > 1) z)
);

-- dentistas (id, username, full_name) — sem credenciais
insert into public._diag (k, v)
select 'dentists', jsonb_agg(x) from (
  select id, username, full_name from public.dentists
) x;

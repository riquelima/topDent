-- Update trigger function notify_new_appointment to handle network errors and timeouts gracefully
-- Applied to Supabase on 2026-06-10

CREATE OR REPLACE FUNCTION public.notify_new_appointment()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
  payload json;
begin
  payload := json_build_object(
    'id', NEW.id,
    'patient_name', NEW.patient_name,
    'patient_cpf', NEW.patient_cpf,
    'appointment_date', NEW.appointment_date,
    'appointment_time', NEW.appointment_time,
    'procedure', NEW.procedure,
    'dentist_id', NEW.dentist_id,
    'dentist_name', NEW.dentist_name,
    'status', NEW.status,
    'notes', NEW.notes,
    'updated_at', NEW.updated_at
  );

  BEGIN
    perform
      http_post(
        'https://primary-production-76569.up.railway.app/webhook/05ab7024-b20b-4558-b665-d88ddfcbba63',
        payload::text,
        'application/json'
      );
  EXCEPTION WHEN OTHERS THEN
    -- Ignora erros de rede, SSL ou timeout para não impedir a criação do agendamento no sistema principal
    RAISE WARNING 'Falha no envio do webhook da automação: %', SQLERRM;
  END;

  return NEW;
end;
$function$;

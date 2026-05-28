CREATE OR REPLACE FUNCTION public.increment_trace_batch_scan_count(p_gs1_trace_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_scan_count integer;
BEGIN
  UPDATE public.trace_batch
  SET
    scan_count = scan_count + 1,
    updated_at = now()
  WHERE gs1_trace_id = p_gs1_trace_id
  RETURNING scan_count INTO next_scan_count;

  RETURN next_scan_count;
END;
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.increment_trace_batch_scan_count(text) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.increment_trace_batch_scan_count(text) TO anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.increment_trace_batch_scan_count(text) TO authenticated;--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'trace_batch'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trace_batch;
  END IF;
END
$$;

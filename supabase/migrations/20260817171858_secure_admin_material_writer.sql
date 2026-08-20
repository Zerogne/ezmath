-- The writer performs a multi-table transaction. Use the function owner's table
-- privileges, while keeping authorization inside the function via is_admin().
alter function public.save_admin_material(
  uuid, public.exam_type, text, text, smallint, integer,
  public.test_type, public.content_status, text, jsonb
) security definer;

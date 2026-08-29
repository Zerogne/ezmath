alter table public.schools
  add column if not exists teacher_registration_code text
  check (teacher_registration_code is null or char_length(teacher_registration_code) between 8 and 64);

update public.schools
set teacher_registration_code = 'AC-7K9M-4P2X'
where slug = 'amjilt-cyber'
  and teacher_registration_code is null;

-- No anon/authenticated SELECT grant is added for this sensitive column.

create unique index if not exists schools_teacher_registration_code_unique_idx
  on public.schools (upper(teacher_registration_code))
  where teacher_registration_code is not null;
done
alter table public.tests drop constraint if exists tests_variant_check;
alter table public.tests add constraint tests_variant_check
  check (variant is null or variant in ('A', 'B', 'C', 'D', 'E'));

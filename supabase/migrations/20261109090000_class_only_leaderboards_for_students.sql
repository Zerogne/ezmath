-- Students see only their classes' weekly rankings; the school-wide ranking is for staff.

/**
 * This week's leaderboard (Monday to today, Ulaanbaatar time), ranked by correct answers.
 * p_scope 'class': members of p_classroom_id; the caller must be a member or the class's teacher.
 * p_scope 'school': students of the caller's school; only teachers, school admins and admins may read it.
 *   Students only ever see their own classes' rankings.
 * Returns no rows when the caller has no access.
 */
create or replace function public.weekly_leaderboard(p_scope text, p_classroom_id uuid default null)
returns table (student_id uuid, full_name text, avatar_url text, problems integer, correct integer, streak integer, rank integer, is_me boolean)
language plpgsql stable security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  v_me uuid := (select auth.uid());
  v_members uuid[];
  v_week_start date := date_trunc('week', private.mn_day(now()))::date;
begin
  if v_me is null then return; end if;
  if p_scope = 'class' then
    if not exists (select 1 from public.classrooms c where c.id = p_classroom_id and c.teacher_id = v_me)
      and not exists (select 1 from public.classroom_students cs where cs.classroom_id = p_classroom_id and cs.student_id = v_me) then
      return;
    end if;
    select array_agg(cs.student_id) into v_members from public.classroom_students cs where cs.classroom_id = p_classroom_id;
  elsif p_scope = 'school' then
    if not exists (select 1 from public.profiles me where me.id = v_me and me.role::text in ('teacher', 'school_admin', 'admin')) then
      return;
    end if;
    select array_agg(p.id) into v_members
    from public.profiles p
    where p.role::text = 'student'
      and p.school_id is not null
      and p.school_id = (select me.school_id from public.profiles me where me.id = v_me);
  else
    return;
  end if;
  if v_members is null then return; end if;

  return query
  with totals as (
    select m.id as uid, coalesce(sum(a.problems), 0)::integer as problems, coalesce(sum(a.correct), 0)::integer as correct
    from unnest(v_members) as m(id)
    left join public.student_daily_activity a on a.user_id = m.id and a.day >= v_week_start
    group by m.id
  )
  select t.uid, coalesce(nullif(trim(p.full_name), ''), 'Сурагч'), p.avatar_url, t.problems, t.correct,
    coalesce(s.streak, 0),
    (rank() over (order by t.correct desc, t.problems desc))::integer,
    t.uid = v_me
  from totals t
  join public.profiles p on p.id = t.uid
  left join private.current_streaks(v_members) s on s.user_id = t.uid
  order by t.correct desc, t.problems desc, p.full_name;
end $$;
revoke execute on function public.weekly_leaderboard(text, uuid) from public;
grant execute on function public.weekly_leaderboard(text, uuid) to authenticated;

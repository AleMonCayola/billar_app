-- =========================================================
-- FIX DE PERMISOS (RLS) - Ejecutar en el SQL Editor de Supabase
-- Esto elimina las políticas viejas y crea unas nuevas más robustas
-- =========================================================

-- 1) Eliminar políticas viejas
drop policy if exists "auth_select_mesas" on mesas;
drop policy if exists "auth_update_mesas" on mesas;
drop policy if exists "auth_all_sesiones" on sesiones;
drop policy if exists "auth_all_cierres" on cierres_caja;

-- 2) Asegurar que RLS está activo
alter table mesas enable row level security;
alter table sesiones enable row level security;
alter table cierres_caja enable row level security;

-- 3) Dar permisos base a nivel de tabla (RLS filtra filas, pero primero
--    el rol necesita permiso de acceso a la tabla)
grant select, insert, update, delete on mesas to authenticated;
grant select, insert, update, delete on sesiones to authenticated;
grant select, insert, update, delete on cierres_caja to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- 4) Nuevas políticas: cualquier usuario autenticado (con sesión válida)
--    puede leer y escribir. "to authenticated" filtra directo por el rol
--    de la sesión, es más confiable que comparar auth.role() manualmente.
create policy "mesas_authenticated_all"
  on mesas for all
  to authenticated
  using (true)
  with check (true);

create policy "sesiones_authenticated_all"
  on sesiones for all
  to authenticated
  using (true)
  with check (true);

create policy "cierres_authenticated_all"
  on cierres_caja for all
  to authenticated
  using (true)
  with check (true);

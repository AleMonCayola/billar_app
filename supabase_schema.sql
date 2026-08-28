-- =========================================================
-- ESQUEMA DE BASE DE DATOS - CONTROL DE TIEMPO DE BILLAR
-- Ejecutar esto en el SQL Editor de tu proyecto Supabase
-- =========================================================

-- Extensión necesaria para generar UUIDs
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- Tabla: mesas
-- 6 mesas fijas, cada una con su total histórico acumulado
-- ---------------------------------------------------------
create table if not exists mesas (
  id serial primary key,
  nombre text not null,
  historico_total numeric(10,2) not null default 0
);

insert into mesas (nombre)
select 'Mesa ' || n
from generate_series(1,6) as n
where not exists (select 1 from mesas);

-- ---------------------------------------------------------
-- Tabla: sesiones
-- Cada sesión = una jugada en una mesa (bloque o libre)
-- ---------------------------------------------------------
create table if not exists sesiones (
  id uuid primary key default gen_random_uuid(),
  mesa_id int not null references mesas(id),
  modo text not null check (modo in ('bloque', 'libre')),
  inicio timestamptz not null default now(),
  fin timestamptz,
  minutos int,               -- minutos totales jugados
  minutos_asignados int,     -- solo modo bloque: minutos configurados (30/60/90/120...)
  monto numeric(10,2),       -- monto final cobrado (redondeado hacia arriba)
  estado text not null default 'activa' check (estado in ('activa', 'cobrada', 'cancelada')),
  fecha date not null default current_date, -- fecha de cobro, para agrupar caja diaria
  created_at timestamptz not null default now()
);

create index if not exists idx_sesiones_fecha on sesiones (fecha);
create index if not exists idx_sesiones_mesa on sesiones (mesa_id);
create index if not exists idx_sesiones_estado on sesiones (estado);

-- ---------------------------------------------------------
-- Tabla: cierres_caja
-- Snapshot de cada cierre de caja diario
-- ---------------------------------------------------------
create table if not exists cierres_caja (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  total numeric(10,2) not null,
  cantidad_cobros int not null,
  closed_at timestamptz not null default now()
);

create index if not exists idx_cierres_fecha on cierres_caja (fecha);

-- =========================================================
-- SEGURIDAD (RLS) - Solo usuarios autenticados pueden usar el sistema
-- =========================================================
alter table mesas enable row level security;
alter table sesiones enable row level security;
alter table cierres_caja enable row level security;

create policy "auth_select_mesas" on mesas for select using (auth.role() = 'authenticated');
create policy "auth_update_mesas" on mesas for update using (auth.role() = 'authenticated');

create policy "auth_all_sesiones" on sesiones for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "auth_all_cierres" on cierres_caja for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- =========================================================
-- FUNCIÓN: actualizar el histórico de la mesa cuando se cobra una sesión
-- =========================================================
create or replace function actualizar_historico_mesa()
returns trigger as $$
begin
  if new.estado = 'cobrada' and (old.estado is distinct from 'cobrada') then
    update mesas
    set historico_total = historico_total + new.monto
    where id = new.mesa_id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_actualizar_historico on sesiones;
create trigger trg_actualizar_historico
  after update on sesiones
  for each row
  execute function actualizar_historico_mesa();

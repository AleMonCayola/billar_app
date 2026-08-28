# 🎱 Control de Tiempo de Billar

App para controlar el tiempo y cobro de 6 mesas de billar, con caja diaria,
historial por mesa y vista mensual. Hecha con Next.js + Supabase.

## 1. Configurar Supabase

1. Crea un proyecto en https://supabase.com
2. Ve a **SQL Editor** y ejecuta todo el contenido del archivo `supabase_schema.sql`
   (esto crea las tablas `mesas`, `sesiones`, `cierres_caja`, la seguridad RLS
   y el trigger que actualiza el histórico por mesa).
3. Ve a **Authentication > Users** y crea manualmente tu usuario (correo + contraseña)
   con el que vas a entrar al sistema. No dejes que la gente se registre sola:
   este proyecto no tiene pantalla de registro, solo de login.
4. Ve a **Project Settings > API** y copia:
   - `Project URL`
   - `anon public key`

## 2. Configurar el proyecto en tu VS Code

```bash
npm install
cp .env.local.example .env.local
```

Edita `.env.local` y pega tus datos de Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

Corre el proyecto localmente:

```bash
npm run dev
```

Abre http://localhost:3000 — te debería redirigir al login.

## 3. Agregar el sonido de alarma

Coloca tu archivo de audio en `public/alarm.mp3` (debe llamarse exactamente así).
Ya está integrado: sonará automáticamente cuando el contador de una mesa en
modo bloque llegue a 0.

## 4. Publicar en Vercel

1. Sube este proyecto a un repositorio de GitHub.
2. Entra a https://vercel.com, importa el repositorio.
3. En la configuración del proyecto en Vercel, agrega las mismas variables
   de entorno (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Deploy.

## Cómo funciona el sistema

- **Modo bloques**: 30 min (8 Bs), 1 hora (15 Bs), 2 horas (30 Bs). Se pueden
  combinar sumando tiempo y precio, incluso con el contador corriendo.
  Al llegar a 0 suena la alarma y la mesa queda esperando el cobro.
- **Modo libre**: el contador sube desde 0 y el precio se calcula a razón de
  0.25 Bs/minuto (tarifa de la hora), redondeado siempre hacia arriba, en
  tiempo real.
- **Caja diaria**: cada cobro queda registrado con mesa, hora de inicio/fin,
  minutos y monto. El botón "Cerrar caja" archiva el total del día.
- **Historial por mesa**: total acumulado histórico de cada mesa, para toda
  la vida del sistema.
- **Vista mensual**: selecciona mes/año y ve el total cobrado por día y el
  total del mes completo.

## Estructura del proyecto

```
app/
  login/        -> pantalla de login
  dashboard/    -> las 6 mesas con sus timers
  caja/         -> caja diaria + cerrar caja
  historial/    -> histórico acumulado por mesa
  mensual/      -> reporte mensual por día
components/
  MesaCard.tsx  -> toda la lógica de una mesa (timer, precios, cobro)
  Nav.tsx       -> barra de navegación
lib/
  pricing.ts    -> reglas de precio (bloques y tarifa libre)
  supabase/     -> clientes de Supabase (browser y server)
supabase_schema.sql -> esquema completo de base de datos
```

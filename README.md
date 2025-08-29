# Invitación de Boda Virtual

Stack:
- Frontend: HTML + CSS + JS vanilla
- Backend BaaS: Supabase (PostgreSQL + Auth + Edge Functions opcionales)
- Hosting: Vercel (static + serverless API routes bajo `/api`)

## Funcionalidades
1. Generar link único por invitado (slug basado en nombre + id) y trackear aperturas / confirmaciones.
2. Invitación personalizada muestra el nombre del invitado.
3. Botones para confirmar asistencia (Sí / No) con persistencia inmediata.
4. Si confirma Sí, aparece pregunta adicional de hospedaje (Sí / No).
5. Panel Admin: listar, buscar, exportar CSV, crear nuevo invitado, ver estado de asistencia y hospedaje, copiar link, editar nombre, borrar invitado.
6. Página "Más información" enlazada desde cada invitación.

## Estructura
```
/public
  index.html            -> Landing general (opcional) o redirect
  invitacion.html       -> Plantilla de invitación (usa query ?i=<slug>)
  admin.html            -> Panel de gestión
  info.html             -> Más información para invitados
  /js
    supabaseClient.js
    invitacion.js
    admin.js
    shared.js
  /styles
    main.css
    admin.css
```

## Variables de Entorno (Vercel)
Configura en Vercel > Project Settings > Environment Variables:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (solo uso en API serverless para operaciones privilegiadas)

## Tablas Supabase SQL
```sql
-- Invitados
create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  slug text unique not null,
  attending boolean,
  lodging boolean,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on guests (slug);

-- Track aperturas (analytics simple)
create table if not exists guest_opens (
  id bigint generated always as identity primary key,
  guest_id uuid references guests(id) on delete cascade,
  opened_at timestamptz default now()
);

-- Trigger para updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;
create trigger trg_guests_updated
before update on guests
for each row execute procedure set_updated_at();
```

## Seguridad RLS
```sql
alter table guests enable row level security;
alter table guest_opens enable row level security;

-- Política pública de lectura solo por slug (invitación)
create policy "select by slug" on guests for select
using ( slug = current_setting('request.jwt.claims', true)::json->>'slug');
-- Simplificación: para prototipo se permitirán selects abiertos (restringir luego)
create policy "allow anon read" on guests for select using (true);

-- Solo service role puede insertar / update / delete (vía API serverless)
```
Para simplificar el MVP, el frontend usará la anon key sólo para lectura de un invitado por slug y updates controlados mediante RPC segura opcional. Inicialmente haremos updates directos (no recomendado para producción) y luego puedes reforzar.

## Flujo Generar Invitado
1. Admin ingresa nombre.
2. JS genera slug: normaliza nombre + 6 chars de id devuelto.
3. Inserta en `guests` (service route API) y devuelve slug.
4. Muestra en tabla con link: `/invitacion.html?i=<slug>`.

## API Routes
- `POST /api/guests` crea invitado.
- `GET /api/guests` lista invitados (paginación / filtro opcional).
- `PATCH /api/guests/:id` edita nombre / estados.
- `DELETE /api/guests/:id` elimina invitado.
- `POST /api/guests/:id/attending` set attending + lodging (body { attending, lodging }).
- `POST /api/track-open` (body { slug }) registra apertura.

## Despliegue
Sube a GitHub y conecta a Vercel. Asegura variables. Deploy.

### Primer push (ejemplo)
```bash
git init
git add .
git commit -m "feat: invitacion boda MVP"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/boda-invitacion.git
git push -u origin main
```

Luego en Vercel: Import Project -> selecciona repo -> añade variables de entorno -> Deploy.

## Próximos pasos
- Añadir auth simple para admin (password en env + prompt) o Supabase Auth.
- Mejorar RLS.
- Añadir métricas (contadores de aperturas, ratio confirmación).
```

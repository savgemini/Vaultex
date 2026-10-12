# Vaultex

Vaultex is a Vite, React, and TypeScript application backed by Supabase.

## Local development

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and set the Supabase project URL and anon key.
3. Start the app with `npm run dev`.

Required frontend environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The anon key is intended for browser use. Do not put a Supabase service-role key in a `VITE_` variable or commit secrets.

## Vercel deployment

1. Import the Git repository into Vercel and select the project root.
2. Use the Vite framework preset, `npm run build` as the build command, and `dist` as the output directory.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the Vercel project for each deployment environment.
4. Deploy. `vercel.json` rewrites client-side routes to `index.html` so direct navigation and refresh work with React Router.
5. Add the deployed site URL to the Supabase Auth site's URL and redirect URL configuration.

Apply the SQL migrations in `supabase/migrations` to the target Supabase project before using database-backed features. Row-level security is required; never expose a service-role key in this frontend.
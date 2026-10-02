# tivorah-web

## Environment validation

Copy `.env.example` to `.env` and set `NEXT_PUBLIC_API_URL` and
`NEXT_PUBLIC_SITE_URL`. Run `npm run env:check`, or pass a specific filename with
`npm run env:check -- --file .env.staging`. The check requires every
`.env.example` key to be present in that file, even when an optional value is
blank. `npm run build` runs the check first.
Add a filename to `.env.yup-exclude` to skip its local file audit. The dynamic
`/api/health` endpoint still returns 503 when required runtime values are invalid.

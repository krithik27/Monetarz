# Vercel Configuration & Environment Archive

This file documents the current configuration and environment variables of the Monetarz project on Vercel.

## Environment Variables

The following environment variables are set in the application (extracted from `.env.local`):

| Variable Name | Value | Purpose / Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rwbgqlwbznrqmvauqlak.supabase.co` | Supabase API connection URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1...` | Supabase Client anonymous key |
| `NEXT_PUBLIC_ARCHIVE_THRESHOLD_DAYS` | `90` | Number of days before transactions are eligible for archiving |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1...` | Server-side Supabase admin key |
| `GEMINI_API_KEY` | `[REDACTED_SEE_LOCAL_ENV]` | Google Gemini API Key |
| `ADMIN_EMAIL` | `krikshank27@gmail.com` | Administrator Email for settings & logic override |
| `NEXT_PUBLIC_ADMIN_EMAIL` | `krikshank27@gmail.com` | Administrator Email for settings & logic override |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `[REDACTED_SEE_LOCAL_ENV]` | Razorpay Client/Test Key |
| `RAZORPAY_KEY_ID` | `[REDACTED_SEE_LOCAL_ENV]` | Razorpay Server Test Key |
| `RAZORPAY_KEY_SECRET` | `[REDACTED_SEE_LOCAL_ENV]` | Razorpay API Secret |
| `RAZORPAY_WEBHOOK_SECRET` | `[REDACTED_SEE_LOCAL_ENV]` | Webhook verification secret |

## Project Decommissioning Steps on Vercel

If you plan to fully delete or archive the project on Vercel:
1. **Pause/Decommission deployments**: Remove any active domain mapping under **Settings > Domains**.
2. **Download Build Logs (Optional)**: If you need build statistics, export them from the Vercel dashboard.
3. **Delete Project**: Once backups are complete, you can go to **Settings > General > Delete Project** on Vercel.

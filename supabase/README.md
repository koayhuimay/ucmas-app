# Supabase setup

One-time manual steps to wire your Supabase project to the app.

## 1. Run the schema

1. Open Supabase Dashboard → **SQL Editor** → **New query**
2. Paste the contents of `schema.sql`
3. Click **Run**

Verify in **Table Editor** that `profiles`, `drill_sessions`, `drill_answers` exist.

## 2. Allow the app's deep link as a redirect URL

Magic links open in the user's email app, then redirect back into the app via the `ucmas://` deep link scheme. Supabase blocks unknown redirect targets by default.

1. Dashboard → **Authentication** → **URL Configuration**
2. **Site URL**: set to `ucmas://`
3. **Redirect URLs** (Additional): add `ucmas://` and `ucmas://*`
4. Save

## 3. Show the 6-digit code in the magic-link email (required)

The app uses a 6-digit OTP code (typed into the app) instead of tapping the link, because deep links are unreliable in Expo Go dev. The default Magic Link template doesn't include the code.

1. Dashboard → **Authentication** → **Email Templates** → **Magic Link**
2. Replace the body with something like:

   ```html
   <h2>Your UCMAS Practice sign-in code</h2>
   <p>Enter this code in the app:</p>
   <p style="font-size:28px;letter-spacing:6px;font-weight:bold">{{ .Token }}</p>
   <p>The code expires in 1 hour.</p>
   ```

3. Save.

Ignore the `{{ .ConfirmationURL }}` link — we don't use it. (You can keep it as a fallback if you like; it just won't work in Expo Go.)

## 4. (Phase 2) Apple/Google SSO

## 5. (Phase 2) Apple/Google SSO

Skip for now. When ready: Dashboard → **Authentication** → **Providers**, enable Apple/Google, and follow Supabase's per-provider setup guides.

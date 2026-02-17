# Google Sign-In Setup Guide (Supabase + React)

This project already has a `Continue with Google` button in `src/pages/auth/Login.jsx`.
Follow these steps to make it work end-to-end.

## 1. Collect your Supabase project info
1. Open Supabase Dashboard.
2. Select your project.
3. Go to `Settings -> API`.
4. Copy your **Project URL**. It looks like:
   - `https://<project-ref>.supabase.co`
5. Build your callback URL from that value:
   - `https://<project-ref>.supabase.co/auth/v1/callback`

You will use this callback URL in Google Cloud.

## 2. Configure Google OAuth consent screen
1. Open Google Cloud Console: <https://console.cloud.google.com/>.
2. Select or create a Google Cloud project.
3. Go to `APIs & Services -> OAuth consent screen`.
4. Choose **External** (common) unless you specifically need Internal Workspace-only login.
5. Fill required fields:
   - App name (example: `Veloure Beauty`)
   - User support email
   - Developer contact email
6. Save and continue through scopes.
   - Default profile/email scopes are enough for Supabase Google login.
7. If your app is in testing mode, add test users:
   - `OAuth consent screen -> Test users -> Add users`
   - Add the Google account(s) you will sign in with.
8. Save and complete setup.

## 3. Create Google OAuth credentials
1. In Google Cloud, go to `APIs & Services -> Credentials`.
2. Click `Create credentials -> OAuth client ID`.
3. Application type: **Web application**.
4. Set a name (example: `Veloure Supabase Auth`).
5. Under **Authorized redirect URIs**, add:
   - `https://<project-ref>.supabase.co/auth/v1/callback`
6. Create.
7. Copy values shown:
   - **Client ID**
   - **Client secret**

Keep these secure. Do not commit secrets to git.

## 4. Enable Google provider in Supabase
1. Open Supabase Dashboard.
2. Go to `Authentication -> Providers -> Google`.
3. Enable Google provider.
4. Paste:
   - Google Client ID
   - Google Client Secret
5. Save.

## 5. Configure redirect URLs in Supabase
1. In Supabase Dashboard, go to `Authentication -> URL Configuration`.
2. Set Site URL (typically your app base URL).
   - Local dev example: `http://localhost:5173`
   - Production example: `https://yourdomain.com`
3. Add Redirect URLs:
   - `http://localhost:5173/login`
   - `https://yourdomain.com/login` (if deployed)
4. Save.

## 6. Local environment check
Make sure your local `.env` contains valid Supabase keys:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

If changed, restart dev server.

## 7. Test locally
1. Run:
   - `npm run dev`
2. Open:
   - `http://localhost:5173/login`
3. Click `Continue with Google`.
4. Complete Google login.
5. Confirm redirect back to your app `/login`, then app routes to:
   - `/dashboard` for normal users
   - `/admin` if user metadata role is `admin`

## 8. Common errors and fixes
- **"redirect_uri_mismatch"**:
  - Your Google OAuth client is missing exact redirect URI:
    `https://<project-ref>.supabase.co/auth/v1/callback`
- **Google button returns to app but not signed in**:
  - Check Supabase provider is enabled and client secret is correct.
- **"access blocked" during testing**:
  - Add your Google account as a test user on consent screen.
- **Redirect fails in production**:
  - Add exact production `/login` URL to Supabase Redirect URLs.

## 9. Security notes
- Never expose Google Client Secret in frontend code.
- Keep secrets in provider settings only (Supabase dashboard).
- Only commit frontend env vars intended for client usage.

## 10. Quick checklist
- [ ] Google OAuth consent screen configured
- [ ] Test users added (if app not published)
- [ ] OAuth Client ID created (Web application)
- [ ] Redirect URI includes Supabase callback
- [ ] Google Client ID/Secret saved in Supabase provider settings
- [ ] Supabase Redirect URLs include local and production `/login`
- [ ] `.env` has valid Supabase URL + anon key
- [ ] Login tested from `http://localhost:5173/login`

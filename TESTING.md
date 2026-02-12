# Authentication Testing Guide

## Prerequisites

Before testing, you need to create a test user in Supabase.

### Create Test User in Supabase Dashboard

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on **Authentication** (shield icon in left sidebar)
3. Click **Users** tab
4. Click **Add user** button (top right)
5. Choose **Create new user**
6. Fill in:
   - **Email:** test@example.com (or any email)
   - **Password:** TestPassword123! (or any password you'll remember)
7. Click **Create user**

## Testing Authentication Flow

### 1. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 2. Test Login

**Expected Behavior:**
- ✅ Root page (`/`) redirects to `/login`
- ✅ Login page displays with email/password form

**Test Steps:**
1. Enter the test user credentials
2. Click "Sign In"
3. Should redirect to `/dashboard`
4. Dashboard shows your user information

### 3. Test Protected Routes

**Test accessing dashboard without login:**
1. Click "Sign Out" button
2. Try to navigate to `/dashboard` directly
3. ✅ Should redirect to `/login`

### 4. Test Logout

**Test Steps:**
1. Log in again
2. Click "Sign Out" button
3. ✅ Should redirect to `/login`
4. ✅ Try accessing `/dashboard` - should redirect back to login

### 5. Test Session Persistence

**Test Steps:**
1. Log in
2. Refresh the page (F5 or Cmd+R)
3. ✅ Should stay logged in (no redirect to login)

### 6. Test Root Page Redirect

**When Logged Out:**
1. Visit http://localhost:3000/
2. ✅ Should redirect to `/login`

**When Logged In:**
1. Log in
2. Visit http://localhost:3000/
3. ✅ Should redirect to `/dashboard`

## Success Criteria

All of these should work:

- ✅ Can log in with valid credentials
- ✅ Cannot log in with invalid credentials (shows error)
- ✅ Protected routes redirect to login when not authenticated
- ✅ Dashboard accessible when logged in
- ✅ Can log out successfully
- ✅ Session persists across page refreshes
- ✅ Root page redirects correctly based on auth status
- ✅ Authenticated users cannot access `/login` (redirects to dashboard)

## Troubleshooting

### "Invalid login credentials" error

- Verify the user exists in Supabase dashboard
- Check that email/password are correct
- Ensure Supabase environment variables are set in `.env.local`

### Infinite redirect loop

- Clear browser cookies and localStorage
- Restart dev server
- Check middleware configuration

### "Cannot find module" errors

- Run `npm install` to ensure all dependencies are installed
- Check that `@supabase/ssr` is installed

## Next Steps

Once authentication is working:
- ✅ TASK-001 to TASK-008: Authentication complete
- ⏭️ TASK-009: Database schema setup
- ⏭️ Build work orders dashboard
- ⏭️ Build form components

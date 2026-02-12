# Supabase Client Utilities

## Usage Guide

### Client Components (Browser)

Use `client.ts` for client-side code:

```tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export function MyComponent() {
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  return <div>User: {user?.email}</div>;
}
```

### Server Components

Use `server.ts` for server-side code:

```tsx
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <div>User: {user?.email}</div>;
}
```

### API Routes (Route Handlers)

Use `server.ts` for API routes:

```tsx
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch data...
  const { data, error } = await supabase
    .from('work_orders')
    .select('*')
    .eq('technician_user_id', user.id);

  return NextResponse.json({ data });
}
```

### Admin Operations

Use `createAdminClient()` when you need to bypass RLS:

```tsx
import { createAdminClient } from '@/lib/supabase/server';

export async function someAdminFunction() {
  const supabaseAdmin = createAdminClient();

  // This bypasses Row Level Security - use carefully!
  const { data } = await supabaseAdmin
    .from('work_orders')
    .select('*'); // Can see ALL work orders

  return data;
}
```

## Important Notes

1. **Never use client.ts in Server Components** - it won't work and will cause errors
2. **Never use server.ts in Client Components** - `cookies()` only works server-side
3. **Admin client bypasses RLS** - only use when absolutely necessary
4. **Middleware handles auth refresh** - sessions stay active automatically

## Files

- `client.ts` - Browser/client component client
- `server.ts` - Server component/API route client
- `types.ts` - TypeScript database types
- `README.md` - This file
- `../middleware.ts` - Auth refresh middleware

# Create or Get Customer Edge Function

This Supabase Edge Function creates or retrieves a customer record associated with a user. It bypasses Row Level Security (RLS) by using the service role key.

## Deployment

To deploy this function to your Supabase project:

1. Make sure you have the Supabase CLI installed:
   ```bash
   npm install -g supabase
   ```

2. Login to your Supabase account:
   ```bash
   supabase login
   ```

3. Link your local project to your Supabase project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Deploy the function:
   ```bash
   supabase functions deploy create-or-get-customer --no-verify-jwt
   ```

## Testing

You can test the function with:

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/create-or-get-customer \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-uuid", "name":"Customer Name", "phone":"123456789"}'
```

## Environmental Variables

The function requires these environment variables to be set in Supabase:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

You can set them with:

```bash
supabase secrets set SUPABASE_URL=https://your-project-ref.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
``` 
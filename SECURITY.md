# Security Policy

## Reporting a Vulnerability

We take the security of ClipDrop seriously. If you believe you have found a security vulnerability, please report it to us by opening a private issue on GitHub or contacting the maintainers directly.

## Best Practices

- **Environment Variables**: Never commit `.env` files. Secrets are managed in the Vercel dashboard.
- **Supabase RLS**: Row Level Security is enabled on all tables.
- **API Keys**: We use `NEXT_PUBLIC_` prefix only for non-sensitive public keys (like Supabase Anon Key). Sensitive keys like `FAL_KEY` are kept server-side.
- **Security Headers**: We use `vercel.json` to enforce HSTS and prevent clickjacking.

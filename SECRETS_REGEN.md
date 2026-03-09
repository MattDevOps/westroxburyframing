# Regenerate Leaked Secrets

**The `.env` file was previously committed to git.** It has been removed from the entire git history. However, any credentials that were in that file should be treated as **compromised** and regenerated.

## Keys to Regenerate

| Secret | Where to regenerate |
|--------|---------------------|
| **Google API key** | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Create new key or restrict the existing one (add HTTP referrer restrictions) |
| **AUTH_SECRET** | Generate new: `openssl rand -base64 32` |
| **Postmark API key** | [Postmark](https://account.postmarkapp.com) → Your server → API Tokens → Regenerate |
| **Square access token** | [Square Developer Dashboard](https://developer.squareup.com/apps) → OAuth → Production → Regenerate |
| **Square webhook signature key** | Re-create or update the webhook subscription in Square; the new subscription will have a new signature key |
| **Database password** | If `DATABASE_URL` contained a password, rotate it in your database provider (Vercel Postgres, Neon, Supabase, etc.) |

## After Regenerating

1. Update your local `.env` and `.env.local` with the new values.
2. Update Vercel (or other hosting) environment variables.
3. Force-push the rewritten history: `git push --force origin master` (coordinate with collaborators first).
4. Consider enabling [GitGuardian](https://www.gitguardian.com/) or similar in your repo to catch future leaks.

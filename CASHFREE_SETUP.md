# Cashfree Payment Gateway Setup

## Required Environment Variables

Add these environment variables to your `.env.local` file (create it if it doesn't exist in the root directory):

```env
# Cashfree Payment Gateway Configuration
NEXT_PUBLIC_CASHFREE_APP_ID=your_app_id_here
CASHFREE_SECRET_KEY=your_secret_key_here
NEXT_PUBLIC_CASHFREE_ENVIRONMENT=sandbox

# App URL (for webhooks and redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## How to Get Cashfree Credentials

### 1. Create a Cashfree Account
- Go to [https://www.cashfree.com](https://www.cashfree.com)
- Sign up for a developer account

### 2. Get Sandbox Credentials (for testing)
1. Log in to Cashfree Dashboard
2. Navigate to **Developers** → **API Keys**
3. Select **Sandbox** environment
4. Copy your **App ID** and **Secret Key**

### 3. Get Production Credentials (for live)
1. Complete KYC verification
2. Navigate to **Developers** → **API Keys**
3. Select **Production** environment
4. Copy your **App ID** and **Secret Key**

## Environment Variable Details

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_CASHFREE_APP_ID` | Your Cashfree App ID (Client ID) | `1234567890abcdef` |
| `CASHFREE_SECRET_KEY` | Your Cashfree Secret Key (Client Secret) | `your_secret_key_here` |
| `NEXT_PUBLIC_CASHFREE_ENVIRONMENT` | Environment: `sandbox` or `production` | `sandbox` |
| `NEXT_PUBLIC_APP_URL` | Your app URL for webhooks | `http://localhost:3000` or `https://yourdomain.com` |

## Setup Steps

1. **Create `.env.local` file** in the root directory (same level as `package.json`)

2. **Add the environment variables** as shown above

3. **Restart your Next.js development server** after adding environment variables:
   ```bash
   npm run dev
   ```

4. **For production**, set these as environment variables in your hosting platform (Vercel, Railway, etc.)

## Testing

- Use **sandbox** environment for testing
- Test payments with Cashfree test cards
- Check Cashfree dashboard for payment logs

## Important Notes

- ⚠️ **Never commit `.env.local` to git** - it should be in `.gitignore`
- 🔒 Keep your Secret Key secure
- 🧪 Use `sandbox` for development and testing
- 🚀 Switch to `production` only when ready for live payments

## Troubleshooting

### "Payment gateway not configured" Error
- Check that all environment variables are set correctly
- Ensure `.env.local` is in the root directory
- Restart your development server after adding variables
- Verify variable names match exactly (case-sensitive)

### Payment Order Creation Fails
- Verify your App ID and Secret Key are correct
- Check that you're using the correct environment (sandbox vs production)
- Ensure your Cashfree account is active
- Check Cashfree dashboard for API error logs


# Vercel Deployment Guide

Your Bank Statement Analyzer is ready to deploy to Vercel! Follow these steps:

## Step 1: Push to GitHub

### If you don't have a GitHub account:
1. Visit https://github.com and create a free account
2. Verify your email

### If you have a GitHub account:
1. Go to https://github.com/new and create a new repository
   - Repository name: `bank-statement-analyzer` (or your preferred name)
   - Description: `Bank Statement Analyzer with Supabase`
   - Make it **Public** (required for free Vercel deployment)
   - Don't initialize with README (we already have one)
   - Click **Create repository**

2. After creating the repo, GitHub will show you commands. Run these in your terminal:

```bash
cd c:/Users/JeremyNg/BankStatement

# Add the remote repository
git remote add origin https://github.com/YOUR_USERNAME/bank-statement-analyzer.git

# Rename branch to main (if needed)
git branch -M main

# Push your code
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 2: Create Vercel Account and Deploy

1. Visit https://vercel.com and sign up (free tier available)
2. Choose "Continue with GitHub" to connect your GitHub account
3. Click "Import Project"
4. Select the `bank-statement-analyzer` repository
5. Click "Import"

## Step 3: Configure Environment Variables in Vercel

Vercel will ask you to configure environment variables before deployment:

1. Add the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://zwfureyplcojtccshcxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   (Use the same values from your `.env.local`)

2. Click **Deploy**

## Step 4: Wait for Deployment

Vercel will:
- Build your Next.js app
- Run optimizations
- Deploy to their CDN

You'll see a progress bar. Once complete, you'll get a live URL like:
`https://bank-statement-analyzer.vercel.app`

## Step 5: Configure Vercel for Supabase

After deployment completes:

1. Go to your project settings in Vercel
2. Click **Environment Variables**
3. Make sure both Supabase variables are set for all environments (Production, Preview, Development)
4. Redeploy if needed

## Important: Update Supabase CORS Settings

Since your app is now hosted on Vercel, update Supabase CORS settings:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel domain to allowed redirect URLs:
   ```
   https://bank-statement-analyzer.vercel.app
   https://bank-statement-analyzer.vercel.app/api/auth/callback/supabase
   ```

## Verify Deployment

1. Visit your Vercel URL
2. Test login/signup functionality
3. Check that theme toggle works
4. Test file upload functionality

## Troubleshooting

### Deployment fails with build errors
- Check Vercel logs for specific errors
- Ensure all environment variables are set
- Run `npm run build` locally to test

### Environment variables not working
- Clear Vercel's cache in Project Settings → Advanced → Redeploy
- Verify variables are in the correct environment

### Supabase connection errors
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are exactly correct (no spaces)
- Verify Supabase RLS policies are configured correctly
- Check CORS settings in Supabase

## Future Deployments

Every time you push to main branch:
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

Vercel will automatically redeploy your app!

## Domain Setup (Optional)

To use a custom domain:
1. In Vercel Dashboard, go to Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Support

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs

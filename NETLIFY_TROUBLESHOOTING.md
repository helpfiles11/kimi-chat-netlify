# Netlify Deployment Troubleshooting Guide

## Current Issues and Solutions

### 1. Status Badge Implementation

**Issue**: Need to add Netlify status badge to show deployment status.

**Solution**:
1. Go to your Netlify dashboard → Site settings → Status badges
2. Copy the badge markdown from there
3. Replace `YOUR_SITE_ID_HERE` in README.md with your actual site ID

**Badge Format**:
```markdown
[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR_SITE_ID/deploy-status)](https://app.netlify.com/sites/kimichatapp/deploys)
```

### 2. Netlify Secrets Scanning Error

**Issue**: Build fails with "Secrets scanning found secrets in build" error.

**Root Cause**: API keys are being embedded in the client-side bundle instead of staying server-side only.

**Solution**: Remove the `env` configuration from `next.config.ts` that embeds environment variables in the bundle:

```typescript
// ❌ WRONG - This embeds secrets in client bundle
const nextConfig = {
  env: {
    MOONSHOT_API_KEY: process.env.MOONSHOT_API_KEY, // This causes security scan failure
  }
}

// ✅ CORRECT - Keep secrets server-side only
const nextConfig = {
  serverExternalPackages: ['openai'], // Only optimization configs
}
```

Environment variables should only be accessed in API routes via `process.env.MOONSHOT_API_KEY`.

### 3. MOONSHOT_API_KEY Environment Variable Error

**Issue**: API key not found despite being set in Netlify UI.

**Root Causes & Solutions**:

#### A. Variable Name Mismatch
- **Check**: Ensure the variable name is exactly `MOONSHOT_API_KEY` (case-sensitive)
- **Location**: Netlify Dashboard → Site settings → Environment variables

#### B. Build vs Runtime Environment
- **Problem**: Variables might not be available during build time
- **Solution**: Prefix with `NEXT_PUBLIC_` if needed for client-side access, but **DON'T** do this for API keys
- **For API keys**: Keep as server-side only (`MOONSHOT_API_KEY`)

#### C. Deployment Context
- **Check**: Ensure variables are set for "Production" context
- **Location**: Netlify Dashboard → Environment variables → "Values for Production"

#### D. Next.js Configuration Issues
**IMPORTANT**: Do NOT use the `env` configuration in `next.config.ts` for API keys as it embeds them in the client-side bundle, causing security issues and Netlify secrets scanning failures.

**Correct configuration**:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Netlify deployment optimizations
  trailingSlash: false,

  // Optimize for serverless functions
  serverExternalPackages: ['openai'],
};

export default nextConfig;
```

Environment variables like `MOONSHOT_API_KEY` should only be accessed server-side in API routes using `process.env.MOONSHOT_API_KEY`.

### 3. 404 Error on Netlify

**Issue**: Site shows "This page could not be found" (404 error).

**Possible Causes & Solutions**:

#### A. Build Output Directory
- **Current**: `publish = ".next"`
- **Alternative**: Try changing to `publish = "out"` and add `output: 'export'` to next.config.ts

#### B. Next.js Plugin Version
- **Check**: Ensure you have the latest `@netlify/plugin-nextjs`
- **Update**: Run `npm update @netlify/plugin-nextjs`

#### C. API Routes Configuration
Next.js API routes need special handling on Netlify. The current configuration should work with the plugin.

#### D. Build Command
Verify your build command succeeds locally:
```bash
npm run build
```

### 4. Recommended Netlify Configuration

**netlify.toml**:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

# Environment variables in Netlify UI:
# MOONSHOT_API_KEY=your_actual_api_key_here
# AUTH_PASSWORD=your_secure_password_here
```

### 5. Environment Variables Checklist

In Netlify Dashboard → Site settings → Environment variables:

- [ ] `MOONSHOT_API_KEY` - Your Kimi API key from platform.moonshot.cn
- [ ] `AUTH_PASSWORD` - Secure password for accessing the chat
- [ ] Variables are set for "Production" context
- [ ] Variable names match exactly (case-sensitive)
- [ ] API key starts with "sk-" (if that's the format)

### 6. Debugging Steps

1. **Check Build Logs**:
   - Go to Netlify Dashboard → Deploys
   - Click on the latest deploy
   - Check for environment variable errors

2. **Test Environment Variables**:
   Add temporary logging to `src/app/api/chat/route.ts`:
   ```typescript
   console.log('API Key configured:', !!process.env.MOONSHOT_API_KEY)
   console.log('API Key first 10 chars:', process.env.MOONSHOT_API_KEY?.substring(0, 10))
   ```

3. **Function Logs**:
   - Go to Netlify Dashboard → Functions
   - Check the logs for your API routes

4. **Local Testing**:
   ```bash
   npm run build
   npm run start
   ```

### 7. Common Pitfalls

- **Don't** use `NEXT_PUBLIC_` prefix for API keys (security risk)
- **Don't** commit `.env.local` to git
- **Do** restart your Netlify build after adding environment variables
- **Do** check that API key format matches Moonshot AI requirements

### 8. Quick Fix Checklist

1. [ ] Verify environment variables in Netlify UI
2. [ ] Trigger new deployment
3. [ ] Check build logs for errors
4. [ ] Test API endpoints individually
5. [ ] Update status badge with correct site ID

## Contact Support

If issues persist:
1. Check Netlify's build logs for specific error messages
2. Verify your Moonshot AI API key is valid and active
3. Test the application locally with the same environment variables
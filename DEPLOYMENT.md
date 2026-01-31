# Deployment Guide for Shared Hosting

This guide explains how to deploy this Next.js application to shared hosting that supports Node.js.

## 📦 What to Upload

**Upload these files/folders:**
- ✅ `app/` - All your application pages
- ✅ `components/` - React components
- ✅ `lib/` - Utility functions and API code
- ✅ `public/` - Static assets (images, etc.)
- ✅ `package.json` - Dependencies and scripts
- ✅ `package-lock.json` or `pnpm-lock.yaml` - Lock file (if using npm/pnpm)
- ✅ `next.config.ts` - Next.js configuration
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `postcss.config.mjs` - PostCSS configuration
- ✅ `tailwind.config.*` - Tailwind config (if exists)
- ✅ `.env.prod` or `.env` - Environment variables (rename to `.env` on server)

**Do NOT upload:**
- ❌ `node_modules/` - Install on server
- ❌ `.next/` - Build folder (created on server)
- ❌ `.git/` - Git repository
- ❌ `.env.local` - Local development env

## 🚀 Deployment Steps

### Step 1: Upload Files
Upload all source files to your hosting account (via FTP, cPanel File Manager, or Git).

### Step 2: Install Dependencies
SSH into your server or use your hosting's terminal/command line interface:

```bash
npm install --production
```

Or if using pnpm:
```bash
pnpm install --production
```

### Step 3: Build the Application
On the server, run:

```bash
npm run build
```

This creates the `.next/` folder with optimized production files.

### Step 4: Set Environment Variables
Create or update `.env` file on the server with:

```env
NEXT_PUBLIC_API_URL=your_api_url_here
PORT=3000
```

**Note:** Your hosting provider may set the `PORT` environment variable automatically. Check their documentation.

### Step 5: Start the Application
Run the start command:

```bash
npm start
```

Or if your hosting uses a process manager (PM2, Forever, etc.):

```bash
pm2 start npm --name "gerar-web" -- start
```

## 🔧 Hosting-Specific Configuration

### cPanel / Shared Hosting
Many shared hosts require:
- **Port:** Usually provided via `process.env.PORT` (already configured)
- **Start Script:** May need to be set in hosting control panel
- **Process Manager:** Some hosts auto-restart, others require PM2

### Common Issues & Solutions

**Issue: Port already in use**
- Solution: Your host sets PORT automatically, or check hosting docs for the correct port

**Issue: Build fails**
- Solution: Ensure Node.js version is 18+ (check with `node -v`)
- Solution: Some hosts require `npm install` without `--production` flag

**Issue: App doesn't start**
- Solution: Check if hosting requires a specific start command
- Solution: Verify `.env` file exists with correct variables
- Solution: Check hosting logs for errors

## 📝 Environment Variables

Make sure these are set in your `.env` file on the server:

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
PORT=3000
```

## ✅ Verification

After deployment:
1. Visit your domain - should see the homepage
2. Check browser console for errors
3. Verify API calls are working
4. Test authentication flows

## 🔄 Updating the Application

When you need to update:

1. Upload new files (overwrite existing)
2. SSH into server
3. Run: `npm install` (if dependencies changed)
4. Run: `npm run build`
5. Restart: `npm start` or restart via hosting control panel

## 📞 Support

If you encounter issues:
- Check hosting provider's Node.js documentation
- Review server logs
- Verify Node.js version compatibility (requires Node 18+)
- Ensure all environment variables are set correctly

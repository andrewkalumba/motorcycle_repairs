# Deployment Guide

Deploy your motorcycle repair directory to production in minutes!

## Vercel Deployment (Recommended)

Vercel is the recommended platform for Next.js applications, offering the best performance and developer experience.

### Step 1: Prepare Your Repository

1. Initialize a git repository (if not already):
   ```bash
   cd /Users/andrewkalumba/Desktop/claude/motorcycle-directory
   git init
   git add .
   git commit -m "Initial commit: Motorcycle repair directory"
   ```

2. Create a GitHub repository and push your code:
   ```bash
   git remote add origin https://github.com/yourusername/motorcycle-directory.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure your project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: ./
   - **Build Command**: `next build` (default)
   - **Output Directory**: `.next` (default)

5. Add Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://mcfyffbyiohcsimzwhoh.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
   ```

6. Click "Deploy"

### Step 3: Verify Deployment

Your app will be live at: `https://your-project-name.vercel.app`

### Automatic Deployments

Every push to main branch will automatically trigger a new deployment!

---

## Alternative: Netlify Deployment

### Option 1: Git-based Deployment

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" > "Import an existing project"
3. Connect to your Git provider
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
5. Add environment variables in Netlify dashboard
6. Deploy!

### Option 2: Manual Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build your project
npm run build

# Deploy
netlify deploy --prod
```

---

## Alternative: Railway Deployment

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Select your repository
5. Railway auto-detects Next.js and configures everything
6. Add environment variables in Railway dashboard
7. Deploy!

---

## Alternative: DigitalOcean App Platform

1. Go to [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. Navigate to App Platform
3. Click "Create App"
4. Connect your GitHub repository
5. Configure:
   - **Source Directory**: /
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start`
6. Add environment variables
7. Launch!

---

## Alternative: AWS Amplify

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "New app" > "Host web app"
3. Connect your repository
4. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```
5. Add environment variables
6. Save and deploy

---

## Self-Hosting with Docker

### Create Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Create .dockerignore

```
node_modules
.next
.git
.env*.local
README.md
```

### Build and Run

```bash
# Build image
docker build -t motorcycle-directory .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  motorcycle-directory
```

---

## Environment Variables Checklist

Before deploying, ensure these environment variables are set:

- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Security Note**: The `NEXT_PUBLIC_` prefix makes these variables accessible in the browser. This is safe for Supabase anonymous keys, but never expose secret keys this way.

---

## Post-Deployment Checklist

After deployment, verify:

- ✅ Homepage loads correctly
- ✅ Shops are displayed from Supabase
- ✅ All filters work (search, country, city, rating)
- ✅ Google Maps links work
- ✅ Images load (motor.jpg background)
- ✅ Responsive design works on mobile
- ✅ Back to top button appears on scroll
- ✅ Loading states display correctly
- ✅ Error handling works (test by disabling Supabase temporarily)

---

## Custom Domain Setup

### Vercel

1. Go to your project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. SSL certificate is automatically provisioned

### Netlify

1. Go to "Domain settings"
2. Add custom domain
3. Update DNS records
4. Enable HTTPS (automatic)

---

## Performance Optimization

After deployment, consider:

1. **Enable Caching**:
   - Static assets are automatically cached
   - Consider ISR (Incremental Static Regeneration) for shop data

2. **Image Optimization**:
   - Next.js Image component is ready to use
   - Replace `<img>` tags with `<Image>` component

3. **Analytics**:
   - Add Vercel Analytics (built-in)
   - Or integrate Google Analytics

4. **Monitoring**:
   - Set up error tracking (Sentry, LogRocket)
   - Monitor Supabase usage

---

## Continuous Integration

### GitHub Actions Example

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci

    - name: Run linter
      run: npm run lint

    - name: Build
      run: npm run build
      env:
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

---

## Troubleshooting Deployment Issues

### Build Fails

**Error**: `Module not found`
- Solution: Ensure all dependencies are in `package.json`
- Run `npm install` locally and commit `package-lock.json`

**Error**: TypeScript errors
- Solution: Run `npm run build` locally to identify issues
- Fix type errors before deploying

### Runtime Errors

**Error**: `NEXT_PUBLIC_SUPABASE_URL is not defined`
- Solution: Add environment variables in deployment platform

**Error**: 404 on page refresh
- Solution: Ensure your hosting platform supports Next.js routing
- Vercel and Netlify handle this automatically

### Performance Issues

**Slow initial load**
- Solution: Enable CDN caching
- Consider implementing ISR for shop data

**Large bundle size**
- Solution: Analyze with `npm run build`
- Remove unused dependencies

---

## Scaling Considerations

As your application grows:

1. **Database**: Upgrade Supabase plan if needed
2. **Caching**: Implement Redis for frequently accessed data
3. **CDN**: Use Vercel Edge Network or Cloudflare
4. **Load Testing**: Use tools like k6 or Artillery
5. **Monitoring**: Set up proper logging and alerts

---

## Support

For deployment issues:
- Vercel: [vercel.com/support](https://vercel.com/support)
- Netlify: [netlify.com/support](https://netlify.com/support)
- Next.js: [nextjs.org/docs](https://nextjs.org/docs)

---

## Quick Command Reference

```bash
# Development
npm run dev              # Start dev server

# Production Build
npm run build           # Build for production
npm start              # Start production server

# Linting
npm run lint           # Check code quality

# Docker
docker build -t app .  # Build Docker image
docker run -p 3000:3000 app  # Run container
```

---

Happy deploying! Your motorcycle repair directory is ready for the world! 🏍️

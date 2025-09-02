# Games Inc Jr - Deployment Runbook

## Pre-Deploy Checklist

### Build & Test Commands
```bash
# Type checking
pnpm typecheck

# Build the application
pnpm build

# Test production build locally
pnpm start
```

## Vercel Deployment

### Project Setup
1. **Framework**: Next.js
2. **Node Version**: 18+ (Vercel auto-detects)
3. **Build Command**: `pnpm build` (auto-detected)
4. **Output Directory**: `.next` (auto-detected)
5. **Install Command**: `pnpm install` (auto-detected)

### Environment Variables
```bash
# Admin access
ADMIN_PASSWORD=your_secure_admin_password

# Optional: Payment processing (for future use)
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Optional: AI APIs (for AI games)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Domain Configuration
1. **Connect Domain**: Add `gamesincjr.com` in Vercel dashboard
2. **DNS Records**: Copy A/AAAA + CNAME records from Vercel
3. **Squarespace DNS**: Update DNS records in Squarespace to point to Vercel
4. **SSL**: Vercel automatically provides SSL certificates

## Health Check

### Endpoint
- **URL**: `https://gamesincjr.com/healthz`
- **Expected Response**: `{"ok": true, "time": "2024-01-01T00:00:00.000Z"}`
- **Status Code**: 200

## Post-Deploy Verification

### 1. Core Pages (All should return 200)
- [ ] `/` - Homepage
- [ ] `/games` - Games catalog
- [ ] `/games/space-runner` - Game detail page
- [ ] `/admin/login` - Admin login page
- [ ] `/admin/dashboard` - Admin dashboard (requires login)
- [ ] `/healthz` - Health check endpoint

### 2. SEO & Crawling
- [ ] `/robots.txt` - Returns proper robots.txt
- [ ] `/sitemap.xml` - Returns dynamic sitemap with all pages
- [ ] Meta tags present on all pages
- [ ] Open Graph tags working

### 3. Game Functionality
- [ ] Space Runner demo loads in iframe
- [ ] Game controls work (click to focus)
- [ ] Responsive design on mobile/tablet
- [ ] Loading states display properly

### 4. Security Headers
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: SAMEORIGIN`
- [ ] `Referrer-Policy: no-referrer`
- [ ] `Permissions-Policy` headers present

### 5. Performance
- [ ] Demo files cached properly (`/demos/*` paths)
- [ ] Images load correctly
- [ ] No console errors
- [ ] Fast page load times

## DNS Migration Process

### Before Go-Live
1. Deploy to Vercel with temporary domain
2. Test all functionality thoroughly
3. Verify SSL certificate generation

### Go-Live Day
1. **Connect Domain**: Add `gamesincjr.com` in Vercel
2. **Copy DNS Records**: 
   - A record: `76.76.19.61`
   - AAAA record: `2606:4700:3030::6815:2d2`
   - CNAME: `cname.vercel-dns.com`
3. **Update Squarespace**: Replace existing DNS records
4. **Wait for Propagation**: 24-48 hours for full DNS propagation
5. **Verify**: Check `https://gamesincjr.com` loads correctly

## Troubleshooting

### Common Issues
- **404 on game pages**: Check if `getGameBySlug()` is working
- **Demo not loading**: Verify `/public/demos/` files exist
- **Slow loading**: Check if demo files are being cached
- **DNS issues**: Use `dig gamesincjr.com` to verify DNS propagation

### Rollback Plan
- Revert DNS records in Squarespace to previous values
- Vercel deployment can be rolled back via dashboard
- Previous deployment remains accessible during DNS propagation

## Monitoring

### Key Metrics
- Page load times
- Demo iframe loading success rate
- 404 error rates
- Health check endpoint availability

### Alerts
- Set up Vercel monitoring for deployment failures
- Monitor `/healthz` endpoint for uptime
- Track game page 404s (indicates data layer issues)

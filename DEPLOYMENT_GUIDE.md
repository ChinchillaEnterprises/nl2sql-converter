# Deployment Guide for NL2SQL Converter

## AWS Amplify Deployment Instructions

### Important: Platform Selection

When deploying to AWS Amplify, you MUST select the correct platform:

1. **In AWS Amplify Console**, when creating a new app:
   - Choose **"Host web app"**
   - Connect to GitHub and select your repository
   - **IMPORTANT**: In the "App settings" step, under "Platform", select **"Web Compute (SSR)"** NOT "Web (SPA)"

### Why Web Compute?

This is a Node.js Express application that requires server-side execution. AWS Amplify has two deployment modes:

- **Web (SPA)**: For static sites and single-page applications
- **Web Compute (SSR)**: For server-side applications like Node.js/Express

### Step-by-Step Deployment

1. **Go to AWS Amplify Console**: https://console.aws.amazon.com/amplify/

2. **Create New App**:
   - Click "New app" → "Host web app"
   - Select GitHub and authorize access
   - Choose repository: `ChinchillaEnterprises/nl2sql-converter`
   - Select branch: `main`

3. **Configure Build Settings**:
   - Platform: **Web Compute (SSR)** ⚠️ CRITICAL
   - Build and test settings: Use existing `amplify.yml`
   - Environment variables:
     - Add `PORT` = `3000`

4. **Deploy**:
   - Click "Save and deploy"
   - Wait for deployment (5-10 minutes)

### Troubleshooting

If the app shows only a partial website or database tables don't load:

1. **Check Platform Setting**: Ensure you selected "Web Compute (SSR)" not "Web (SPA)"
2. **Check Build Logs**: Look for any errors during deployment
3. **Test API Endpoints**:
   - Visit `https://your-app.amplifyapp.com/api/debug` to check server status
   - Check browser console for any API errors

### Local Testing

To test locally before deployment:

```bash
npm install
npm start
# Visit http://localhost:3000
```

### Architecture Notes

- Uses in-memory SQLite database (data resets on each deployment)
- Express server handles API routes
- Static files served from `/public` directory
- All API calls use relative URLs for deployment compatibility
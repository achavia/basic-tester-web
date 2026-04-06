# Vercel Deployment Setup

Your application is now configured for Vercel deployment with both frontend and backend combined in a single deployment.

## Architecture

- **Frontend**: React application built with Vite, deployed as static files to `/dist` folder
- **Backend**: Serverless API functions in `/api` folder
  - `api/detect-form.js` - Form field detection using Playwright
  - `api/run-test.js` - Form test execution with field filling and screenshots
  - `api/health.js` - Health check endpoint

## Key Files

- `vercel.json` - Vercel deployment configuration
- `api/` - Serverless functions directory
- `src/services/autoDetectService.js` - Updated to use relative API paths

## How It Works

When deployed to Vercel:
1. Frontend build artifacts are served as static files
2. API requests to `/api/*` are automatically routed to serverless functions
3. The frontend uses relative paths for API calls, so it works on any domain

## Local Development

For local development with Vercel serverless functions:

```bash
# Install Vercel CLI
npm install -g vercel

# Run Vercel dev server (runs frontend and serverless functions locally)
vercel dev
```

Or use the existing approach:
```bash
# Terminal 1 - Start frontend dev server (port 3000)
npm run dev

# Terminal 2 - Start Express server (port 3001)
npm run server
```

## Deployment Steps

### Option 1: Deploy via GitHub (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel: https://vercel.com/new
3. Select your repository
4. Framework: Select "Vite"
5. Root Directory: Leave as default
6. Build Command: `npm run build`
7. Output Directory: `dist`
8. Click Deploy

The deployment will automatically:
- Build your React frontend
- Deploy serverless functions from `/api` folder
- Set up the production URL

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## Environment Variables (if needed)

If you need to add environment variables for the API functions:

1. Go to Vercel project settings
2. Navigate to "Environment Variables"
3. Add your variables
4. Redeploy

## API Endpoints

All API endpoints are available under `/api/`:

- `POST /api/detect-form` - Auto-detect form fields
  - Body: `{ targetUrl, authentication? }`
  - Returns: Form schema with detected fields

- `POST /api/run-test` - Execute form test
  - Body: `{ targetUrl, formSchema, testData, authentication? }`
  - Returns: Test results with screenshots

- `GET/POST /api/health` - Health check
  - Returns: `{ status: "ok", service: "...", environment: "..." }`

## Performance Notes

- Vercel serverless functions have a 60-second timeout (configured in vercel.json)
- Each Playwright instance is allocated 3008MB memory
- Functions are stateless - browser closes after each request
- Screenshots are returned as base64 data URLs (included in response)

## Troubleshooting

### Build fails locally
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Serverless functions timeout
- Check form complexity and field count
- Verify target URL responds quickly
- Monitor network conditions

### CORS issues
- All API functions include proper CORS headers
- Should work from any origin in production

## Next Steps

1. Push code to GitHub
2. Connect to Vercel
3. Deploy
4. Test with: `https://your-project.vercel.app`

For help: https://vercel.com/docs

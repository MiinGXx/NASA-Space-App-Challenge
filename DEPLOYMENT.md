# NASA Space App Challenge - Deployment Guide

## Environment Variables Required

Set these environment variables in your Azure App Service or Static Web App:

### Required Configuration
```bash
AZURE_AI_ENDPOINT=https://your-azure-ai-endpoint.openai.azure.com/openai/deployments/your-model/chat/completions?api-version=2024-02-15-preview
AZURE_AI_API_KEY=your-azure-ai-api-key
AZURE_AI_MODEL=HackathonAI
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app-domain.azurewebsites.net
```

### Deployment Options

#### Option 1: Azure App Service (Recommended)
- Uses GitHub Actions workflow: `.github/workflows/deploy-azure.yml`
- Requires: `AZURE_WEBAPP_PUBLISH_PROFILE` secret in GitHub repository
- Supports server-side rendering and API routes
- Auto-scaling and custom domains

#### Option 2: Azure Static Web Apps
- Uses GitHub Actions workflow: `.github/workflows/deploy-azure.yml` (deploy-static job)
- Requires: `AZURE_STATIC_WEB_APPS_API_TOKEN` secret in GitHub repository
- Best for static sites with serverless functions
- Global CDN distribution

### Secrets to Add in GitHub Repository

1. `AZURE_WEBAPP_PUBLISH_PROFILE` - Download from Azure App Service
2. `AZURE_STATIC_WEB_APPS_API_TOKEN` - Get from Azure Static Web Apps resource

### Health Check Endpoint

The application includes a health check at `/api/health` that monitors:
- External API connectivity (Open-Meteo weather and air quality APIs)
- Azure AI service configuration
- Application memory and uptime

### Production Optimizations Applied

1. **Next.js Configuration**
   - Standalone output for optimal Docker/Azure deployment
   - Image optimization disabled for better compatibility
   - Security headers configured
   - Bundle analysis tools included

2. **Performance**
   - Package import optimization for common libraries
   - Compression enabled
   - Cache headers for API routes
   - SWC minification

3. **Security**
   - CSP headers configured
   - X-Frame-Options set to deny
   - Content type sniffing disabled
   - Secure referrer policy

4. **Monitoring**
   - Health check endpoint
   - Error boundaries
   - Production logging

### Build Process

The GitHub Actions workflow:
1. Sets up Node.js and pnpm
2. Installs dependencies with frozen lockfile
3. Runs linting and type checking
4. Builds the application
5. Deploys to Azure (App Service or Static Web Apps)

### Local Development

```bash
cd WebApp
pnpm install
pnpm run dev
```

### Production Build Testing

```bash
cd WebApp
pnpm run build:prod
pnpm run start:prod
```

The application will be available at the configured Azure URL once deployed.
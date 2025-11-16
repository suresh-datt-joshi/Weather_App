# Netlify Deployment Guide

This guide will help you deploy your Weather App to Netlify.

## Prerequisites

- A GitHub account
- A Netlify account (free tier is fine)
- Your code pushed to GitHub

## Deployment Steps

### Option 1: Deploy via Netlify Dashboard (Recommended)

1. **Sign in to Netlify**
   - Go to [https://app.netlify.com](https://app.netlify.com)
   - Sign in with your GitHub account

2. **Add New Site**
   - Click "Add new site" → "Import an existing project"
   - Select "GitHub" as your Git provider
   - Authorize Netlify to access your GitHub repositories if prompted

3. **Select Repository**
   - Find and select `Weather_App` repository
   - Click "Import"

4. **Configure Build Settings**
   - **Build command**: Leave empty (no build needed)
   - **Publish directory**: `.` (current directory)
   - Netlify will automatically detect the `netlify.toml` configuration

5. **Environment Variables**
   - **No environment variables needed!** 
   - The app uses Open-Meteo API which is free and doesn't require an API key

6. **Deploy**
   - Click "Deploy site"
   - Wait for deployment to complete (usually 1-2 minutes)

7. **Access Your Site**
   - Once deployed, Netlify will provide you with a URL like: `https://your-app-name.netlify.app`
   - Your app is now live!

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize Site**
   ```bash
   netlify init
   ```
   - Follow the prompts to link your site
   - Choose "Create & configure a new site"
   - Select your team (or create one)
   - Give your site a name

4. **Deploy**
   ```bash
   netlify deploy --prod
   ```

## Configuration Files

The project includes:
- `netlify.toml` - Netlify configuration with redirects for API routes
- `netlify/functions/` - Serverless functions for weather and forecast APIs

## Features

- ✅ No API key required (uses free Open-Meteo API)
- ✅ Serverless functions for API endpoints
- ✅ Automatic HTTPS
- ✅ Custom domain support
- ✅ Continuous deployment from GitHub

## Troubleshooting

### Functions Not Working
- Check Netlify function logs: Site → Functions → View logs
- Ensure `netlify.toml` redirects are configured correctly

### CORS Issues
- CORS headers are already configured in the functions
- If issues persist, check browser console for errors

### Build Errors
- No build step is required for this static site
- If you see build errors, check that `netlify.toml` is correct

## Custom Domain

To add a custom domain:
1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Follow the DNS configuration instructions

## Support

For issues or questions:
- Check Netlify docs: https://docs.netlify.com
- Check function logs in Netlify dashboard


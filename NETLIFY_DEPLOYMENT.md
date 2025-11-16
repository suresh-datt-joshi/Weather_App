# Netlify Deployment Guide

This guide will help you deploy your Weather App to Netlify.

## Prerequisites

1. A Netlify account (sign up at [netlify.com](https://netlify.com))
2. Your project code ready for deployment
3. An OpenWeatherMap API key (optional - app includes a default key)

## Deployment Steps

### Option 1: Deploy via Netlify CLI (Recommended)

1. **Install Netlify CLI** (if not already installed):
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Initialize Netlify in your project**:
   ```bash
   netlify init
   ```
   
   Follow the prompts:
   - Create & configure a new site? **Yes**
   - Team: Select your team
   - Site name: Press Enter for default or enter a custom name
   - Build command: Press Enter (leave empty - no build needed)
   - Directory to deploy: Press Enter (current directory `.`)

4. **Deploy your project**:
   ```bash
   netlify deploy --prod
   ```

5. **Set Environment Variables** (if using your own API key):
   ```bash
   netlify env:set WEATHER_API_KEY "your-api-key-here"
   ```
   Or set it in the Netlify dashboard (see Option 2, Step 3)

### Option 2: Deploy via GitHub (Easiest)

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add Netlify deployment configuration"
   git push origin main
   ```

2. **Import to Netlify**:
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select your repository
   - Netlify will auto-detect settings from `netlify.toml`

3. **Configure Environment Variables** (optional):
   - In your project settings on Netlify
   - Go to "Site configuration" → "Environment variables"
   - Click "Add a variable"
   - Add `WEATHER_API_KEY` with your OpenWeatherMap API key
   - Click "Save"

4. **Deploy**:
   - Click "Deploy site"
   - Your app will be live in minutes!

## Project Structure for Netlify

```
Weather_App/
├── netlify/
│   └── functions/
│       ├── weather.js      # Netlify Function for weather API
│       └── forecast.js     # Netlify Function for forecast API
├── api/                    # Vercel functions (kept for Vercel deployment)
│   ├── weather.js
│   └── forecast.js
├── index.html              # Main HTML file
├── client.js               # Frontend JavaScript
├── style.css               # Custom styles
├── package.json            # Dependencies
├── netlify.toml            # Netlify configuration
└── vercel.json             # Vercel configuration (for Vercel deployment)
```

## Environment Variables

The app uses the following environment variable:

- `WEATHER_API_KEY`: Your OpenWeatherMap API key (optional - app includes a default key)

**Note:** The app includes a fallback API key, so environment variables are **optional**. However, if the default key is expired or rate-limited, you should set your own.

### Setting Environment Variables in Netlify:

1. **Via Dashboard:**
   - Go to Netlify dashboard → Your project
   - Click "Site configuration" → "Environment variables"
   - Click "Add a variable"
   - Name: `WEATHER_API_KEY`
   - Value: Your API key
   - Scope: Select all (Production, Deploy previews, Branch deploys)
   - Click "Save"
   - Redeploy your site

2. **Via CLI:**
   ```bash
   netlify env:set WEATHER_API_KEY "your-api-key-here"
   netlify deploy --prod
   ```

### Getting an OpenWeatherMap API Key:

1. Go to https://openweathermap.org/api
2. Sign up for a free account
3. Navigate to API keys section
4. Copy your API key
5. Add it to Netlify as described above

## API Endpoints

After deployment, your API endpoints will be available at:
- `https://your-app.netlify.app/.netlify/functions/weather`
- `https://your-app.netlify.app/.netlify/functions/forecast`

The `netlify.toml` configuration automatically redirects `/api/*` to `/.netlify/functions/*`, so these URLs also work:
- `https://your-app.netlify.app/api/weather`
- `https://your-app.netlify.app/api/forecast`

## How Netlify Functions Work

Netlify Functions are serverless functions that:
- Are located in the `netlify/functions/` directory
- Use the `exports.handler` format
- Receive `event` and `context` parameters
- Return a response object with `statusCode`, `headers`, and `body`

The functions are automatically deployed when you deploy your site.

## Troubleshooting

### API Endpoints Return 404

1. **Verify netlify.toml exists:**
   - Ensure `netlify.toml` is in the root directory
   - Check that redirect rules are correct

2. **Check Functions Directory:**
   - Ensure functions are in `netlify/functions/` directory
   - Verify function files are committed to git

3. **Check Netlify Function Logs:**
   - Go to Netlify dashboard → Your project
   - Click "Functions" tab
   - Check for any errors in the logs

4. **Redeploy:**
   - Trigger a new deployment
   - Wait for build to complete

### API Returns 500 Error

1. **Check Function Logs:**
   - Go to Netlify dashboard → Functions tab
   - Click on the function name
   - Check "Logs" for error messages

2. **Verify API Key:**
   - Check environment variables are set correctly
   - Test API key at openweathermap.org
   - Ensure environment variable name is `WEATHER_API_KEY`

3. **Check Function Code:**
   - Verify function exports `exports.handler`
   - Check for syntax errors
   - Ensure CORS headers are set correctly

### Static Files Not Loading

1. **Verify publish directory:**
   - In `netlify.toml`, `publish = "."` should be set
   - All static files should be in root directory

2. **Check file paths:**
   - Ensure paths in HTML are relative (not absolute)
   - Verify files are committed to git

### CORS Issues

- The functions include CORS headers
- If issues persist, check browser console for specific errors
- Verify `Access-Control-Allow-Origin` header is set to `*`

## Post-Deployment

After successful deployment:
1. Your app will be available at `https://your-app-name.netlify.app`
2. You can customize the domain in Netlify site settings
3. Every push to your main branch will trigger automatic deployments (if connected to GitHub)

## Netlify vs Vercel

Both platforms work great! Here are the differences:

**Netlify:**
- Functions in `netlify/functions/` directory
- Uses `netlify.toml` for configuration
- Functions use `exports.handler` format
- Automatic deployments from GitHub

**Vercel:**
- Functions in `api/` directory
- Uses `vercel.json` for configuration
- Functions use `module.exports` format
- Automatic deployments from GitHub

You can deploy to both platforms simultaneously - they use different function directories and configurations.

## Need Help?

- Netlify Documentation: https://docs.netlify.com
- Netlify Functions: https://docs.netlify.com/functions/overview/
- Netlify Support: https://www.netlify.com/support/


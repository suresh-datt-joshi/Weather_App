# Vercel Deployment Guide

This guide will help you deploy your Weather App to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your project code ready for deployment
3. An OpenWeatherMap API key (optional - app includes a default key)

## Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy your project**:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? Select your account
   - Link to existing project? **No** (for first deployment)
   - Project name? Press Enter for default or enter a custom name
   - Directory? Press Enter (current directory)
   - Override settings? **No**

4. **Set Environment Variables** (if using your own API key):
   ```bash
   vercel env add WEATHER_API_KEY
   ```
   Enter your OpenWeatherMap API key when prompted.

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect the settings

3. **Configure Environment Variables**:
   - In your project settings on Vercel
   - Go to "Environment Variables"
   - Add `WEATHER_API_KEY` with your OpenWeatherMap API key (optional)

4. **Deploy**:
   - Click "Deploy"
   - Your app will be live in minutes!

## Environment Variables

The app uses the following environment variable:

- `WEATHER_API_KEY`: Your OpenWeatherMap API key (optional - app includes a default key)

To set it in Vercel:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add `WEATHER_API_KEY` with your API key value
4. Redeploy your application

## Project Structure for Vercel

```
Weather_App/
├── api/
│   ├── weather.js      # Serverless function for weather API
│   └── forecast.js     # Serverless function for forecast API
├── index.html          # Main HTML file
├── client.js           # Frontend JavaScript
├── style.css           # Custom styles
├── package.json        # Dependencies
├── vercel.json         # Vercel configuration
└── .vercelignore       # Files to ignore during deployment
```

## API Endpoints

After deployment, your API endpoints will be available at:
- `https://your-app.vercel.app/api/weather`
- `https://your-app.vercel.app/api/forecast`

## Troubleshooting

### 404 Error - "Failed to load resource: the server responded with a status of 404"

This error can occur for several reasons. Follow these steps to diagnose and fix:

#### Step 1: Identify What's Returning 404

1. **Open Browser Developer Tools** (F12 or Right-click → Inspect)
2. **Go to the Network tab**
3. **Reload the page**
4. **Check which resources are returning 404**:
   - API endpoints (`/api/weather` or `/api/forecast`)?
   - Static files (`client.js`, `style.css`)?
   - The main page (`index.html`)?

#### Step 2: Fix API Route 404 Errors

If API endpoints are returning 404:

1. **Verify API files exist**:
   - Ensure `api/weather.js` and `api/forecast.js` are in the `api/` folder
   - Check that files are committed to your repository
   - Verify files export a default function: `module.exports = async (req, res) => { ... }`

2. **Check Vercel Function Logs**:
   - Go to your Vercel project dashboard
   - Click on "Functions" tab
   - Check for any build errors or runtime errors
   - Look for error messages in the logs
   - Common errors: "Function not found", "Module not found", or syntax errors

3. **Verify vercel.json configuration**:
   - Ensure `vercel.json` exists in the root directory
   - The configuration should use `rewrites` for API routes (not `routes`)
   - API routes should be handled before static file routes
   - Current correct configuration:
     ```json
     {
       "version": 2,
       "rewrites": [
         {
           "source": "/api/:path*",
           "destination": "/api/:path*"
         }
       ],
       "routes": [
         {
           "src": "/(.*\\.(html|css|js|png|jpg|jpeg|gif|svg|ico|json|woff|woff2|ttf|eot))",
           "dest": "/$1"
         },
         {
           "src": "/(.*)",
           "dest": "/index.html"
         }
       ]
     }
     ```

4. **Verify API function structure**:
   - Each API file should export a function that handles `req` and `res`
   - Functions should handle CORS headers properly
   - Check that functions handle OPTIONS requests for CORS preflight

5. **Test API endpoints directly**:
   - Try accessing: `https://your-app.vercel.app/api/weather?city=London`
   - Check if you get a response or an error message
   - Test with curl: `curl "https://your-app.vercel.app/api/weather?city=London"`
   - Check the response status code and body

6. **Check Function Deployment**:
   - In Vercel dashboard → Functions tab
   - Verify that `/api/weather` and `/api/forecast` appear in the functions list
   - If functions don't appear, they may not be detected correctly

7. **Redeploy**:
   ```bash
   vercel --prod
   ```
   Or trigger a redeploy from the Vercel dashboard

#### Step 3: Fix Static File 404 Errors

If CSS, JS, or other static files are returning 404:

1. **Verify file paths in index.html**:
   - Ensure paths are relative: `href="style.css"` not `href="/style.css"`
   - Check that `client.js` is referenced correctly: `src="client.js"`

2. **Check file locations**:
   - All static files should be in the root directory
   - Files should be committed to git

3. **Verify vercel.json routing**:
   - The static file route should match file extensions
   - Ensure the catch-all route points to `index.html`

#### Step 4: Fix Main Page 404 Error

If the main page returns 404:

1. **Check index.html exists**:
   - Ensure `index.html` is in the root directory
   - Verify it's committed to your repository

2. **Verify routing configuration**:
   - The catch-all route in `vercel.json` should route to `index.html`
   - Check that the route order is correct (specific routes before catch-all)

#### Step 5: Common Solutions

**Solution 1: Fix vercel.json Configuration** ✅ (Updated)
- Use `rewrites` instead of `routes` for API endpoints
- API routes must be handled before static file routes
- The `rewrites` section ensures API routes are properly routed to serverless functions
- Current configuration:
  ```json
  {
    "version": 2,
    "rewrites": [
      {
        "source": "/api/:path*",
        "destination": "/api/:path*"
      }
    ],
    "routes": [
      {
        "src": "/(.*\\.(html|css|js|png|jpg|jpeg|gif|svg|ico|json|woff|woff2|ttf|eot))",
        "dest": "/$1"
      },
      {
        "src": "/(.*)",
        "dest": "/index.html"
      }
    ]
  }
  ```

**Solution 2: Clear Vercel Cache**
- In Vercel dashboard, go to Settings → General
- Click "Clear Build Cache"
- Redeploy your application
- This clears any cached routing configurations

**Solution 3: Check Build Output**
- In Vercel dashboard, check the "Build Logs"
- Look for any warnings or errors during build
- Ensure all files are being included in the deployment
- Check that API functions are being detected: Look for messages like "Detected Serverless Functions"

**Solution 4: Verify Project Settings**
- In Vercel dashboard → Settings → General
- Check "Root Directory" is set correctly (should be empty or `.`)
- Verify "Build Command" and "Output Directory" settings
- For this project, Build Command should be empty (no build step needed)
- Output Directory should be empty (serving from root)

**Solution 5: Verify API Function Format**
- Ensure API functions use the correct export format:
  ```javascript
  module.exports = async (req, res) => {
    // Your function code
  };
  ```
- Functions should handle both GET and OPTIONS methods
- CORS headers should be set properly

**Solution 6: Check File Structure**
- Ensure your project structure matches:
  ```
  Weather_App/
  ├── api/
  │   ├── weather.js
  │   └── forecast.js
  ├── index.html
  ├── client.js
  ├── style.css
  └── vercel.json
  ```
- All files should be committed to git
- No `.vercelignore` should exclude API files

#### Step 6: Debugging Checklist

**File Structure:**
- [ ] All files are committed to git
- [ ] `vercel.json` is in the root directory
- [ ] `api/` folder contains `weather.js` and `forecast.js`
- [ ] `index.html`, `client.js`, and `style.css` are in root directory
- [ ] File paths in HTML are relative (not absolute)

**Configuration:**
- [ ] `vercel.json` uses `rewrites` for API routes
- [ ] API routes are configured before static file routes
- [ ] Environment variables are set in Vercel (if needed)
- [ ] Root Directory setting is empty or `.` in Vercel dashboard

**Deployment:**
- [ ] Build logs show no errors
- [ ] Functions appear in Vercel dashboard → Functions tab
- [ ] Function logs show no runtime errors
- [ ] API endpoints return 200 status (not 404)

**Testing:**
- [ ] Can access `https://your-app.vercel.app/api/weather?city=London`
- [ ] Can access `https://your-app.vercel.app/api/forecast?lat=51.5074&lon=-0.1278`
- [ ] Static files load correctly (CSS, JS)
- [ ] Main page loads without errors

### API Routes Not Working

**Common Causes:**
1. **Incorrect vercel.json configuration**
   - Solution: Use `rewrites` for API routes, not `routes`
   - Ensure API routes are handled before static file routes

2. **API functions not detected**
   - Solution: Verify functions are in `/api` folder
   - Check that functions export correctly: `module.exports = async (req, res) => {}`
   - Ensure files are committed to git

3. **Function runtime errors**
   - Solution: Check Vercel Function logs in dashboard
   - Verify environment variables are set
   - Check for syntax errors in API files

4. **CORS issues**
   - Solution: Ensure OPTIONS requests are handled
   - Verify CORS headers are set correctly in API functions

**Quick Fix Steps:**
1. Verify `vercel.json` uses `rewrites` for `/api/:path*`
2. Check Functions tab in Vercel dashboard for errors
3. Test API endpoints directly in browser or with curl
4. Clear build cache and redeploy
5. Check browser console for specific error messages

### Static Files Not Loading
- Ensure all static files (HTML, CSS, JS) are in the root directory
- Check that file paths in HTML are relative (not absolute)
- Verify files are committed to your repository

### CORS Issues
- The API functions include CORS headers
- If issues persist, check browser console for specific errors

## Post-Deployment

After successful deployment:
1. Your app will be available at `https://your-app-name.vercel.app`
2. You can customize the domain in Vercel project settings
3. Every push to your main branch will trigger automatic deployments

## Need Help?

- Vercel Documentation: https://vercel.com/docs
- Vercel Support: https://vercel.com/support


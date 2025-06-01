# Google OAuth Setup Guide

## Current Configuration

Your Google OAuth is partially configured with:
- **Client ID**: `98725639726-6dssck1c04vcnj8ibbgo0fn5sqv95g7p.apps.googleusercontent.com`
- **Redirect URI**: `http://localhost:8000/api/auth/google/callback`

## What You Need to Complete

1. **Google Client Secret**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to your project
   - Go to "APIs & Services" > "Credentials"
   - Click on your OAuth 2.0 Client ID
   - Copy the Client Secret

2. **Add the Client Secret to Your Environment**
   
   Create a `.env` file in the `backend` directory:
   ```bash
   cd backend
   echo "GOOGLE_CLIENT_SECRET=your-client-secret-here" > .env
   ```

3. **Configure Authorized Redirect URIs in Google Console**
   
   In your Google OAuth 2.0 Client settings, add these redirect URIs:
   - `http://localhost:8000/api/auth/google/callback`
   - `http://localhost:3001/auth/callback` (for frontend redirect)

## How It Works

1. User clicks "Continue with Google" on the login page
2. They're redirected to Google's OAuth consent screen
3. After authorization, Google redirects back to your backend
4. Backend exchanges the code for a token and gets user info
5. Backend creates/finds the user and generates a JWT token
6. User is redirected to the frontend with the token
7. Frontend stores the token and logs the user in

## Testing

1. Go to http://localhost:3001/auth/login
2. Click "Continue with Google"
3. Sign in with your Google account
4. You should be redirected back and logged in automatically

## Features

- Automatic user creation for new Google users
- Username derived from Google display name or email
- No password required for OAuth users
- Automatic agent creation for new users
- Seamless integration with existing auth system 
# Google OAuth Setup Guide

## Prerequisites
- A Google Cloud Platform account
- Access to the Google Cloud Console

## Step 1: Create a Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one

## Step 2: Enable the Google Sign-In API
1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Google Identity Services" and enable it

## Step 3: Configure OAuth Consent Screen
1. Navigate to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (unless you have a Google Workspace organization)
3. Fill in the required information:
   - App name
   - User support email
   - Developer contact information
4. Click "Save and Continue"
5. Add the necessary scopes (email, profile)
6. Add test users if needed
7. Complete the setup

## Step 4: Create OAuth Client ID
1. Navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Add a name for the client ID
5. **IMPORTANT: Add authorized JavaScript origins:**
   - `http://localhost:3000` (for local development)
   - Add your production domain when deploying
6. Add authorized redirect URIs:
   - `http://localhost:3000` (for local development)
   - `http://localhost:3000/login` (for local development)
   - `http://localhost:3000/register` (for local development)
   - Add your production redirect URIs when deploying
7. Click "Create"
8. Copy the generated Client ID and Client Secret

## Step 5: Update Environment Variables
1. Update the `.env` file with your Client ID and Secret:
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

## Troubleshooting
- If you see "The given origin is not allowed for the given client ID", make sure you've added the correct origin to the authorized JavaScript origins in the Google Cloud Console.
- If you see "Invalid token" errors, ensure the Client ID is the same in both frontend and backend.
- If you see "redirect_uri_mismatch" errors, make sure you've added all the necessary redirect URIs to the Google Cloud Console.

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In Documentation](https://developers.google.com/identity/sign-in/web) 
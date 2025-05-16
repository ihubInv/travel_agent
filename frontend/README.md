# Flight Agent with Authentication

A full-stack application with user authentication, Google OAuth, and chat functionality using Next.js, Flask, and MongoDB.

## Features

- User authentication (register, login, logout)
- Google OAuth integration
- Password reset functionality
- Chat interface with MongoDB storage
- Responsive design
- TypeScript support

## Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- MongoDB
- Google OAuth credentials

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd flight-agent
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

4. Set up environment variables:
- Copy `.env.example` to `.env`
- Update the variables with your values:
  - `SECRET_KEY`: A secure random string for JWT
  - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
  - `MONGODB_URI`: Your MongoDB connection string
  - `NEXT_PUBLIC_API_URL`: Backend API URL
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Your Google OAuth client ID

5. Start MongoDB:
```bash
mongod
```

6. Start the backend server:
```bash
cd backend
python app.py
```

7. Start the frontend development server:
```bash
npm run dev
```

## Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to Credentials
5. Create an OAuth 2.0 Client ID
6. Add authorized JavaScript origins:
   - `http://localhost:3000`
7. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
8. Copy the Client ID and update your `.env` file

## Usage

1. Open `http://localhost:3000` in your browser
2. Register a new account or login with Google
3. Start chatting with the AI assistant
4. Your chat history will be saved in MongoDB

## Project Structure

```
flight-agent/
├── app/                    # Next.js app directory
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── forgot-password/   # Password reset page
│   └── chat/              # Chat page
├── components/            # React components
│   ├── auth-provider.tsx  # Authentication context
│   ├── chat.tsx          # Chat component
│   └── ui/               # UI components
├── backend/              # Flask backend
│   ├── app.py           # Main Flask application
│   └── requirements.txt  # Python dependencies
└── .env                 # Environment variables
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
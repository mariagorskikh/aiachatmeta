# Agent Chat - AI-Powered Communication Platform

An innovative chat application that transforms messages using AI agents with customizable tones and personalities. Built with FastAPI backend and Next.js frontend.

## 🌟 Features

- **User Authentication**: Google OAuth and username/password login
- **Friend-to-Friend Chat**: Individual conversations with other users
- **AI Message Transformation**: Transform your messages with different AI agent tones:
  - **Smarter**: Sophisticated vocabulary and intelligent phrasing
  - **Professional**: Formal business communication
  - **Nicer**: Warmer and friendlier tone
  - **Meaner**: Colder and more critical
  - **Sarcasm**: Subtle sarcasm and wit
  - **Loving**: Warm and affectionate
  - **Angry**: Express frustration civilly
  - **Custom**: Your own custom transformation prompt
- **Real-time Updates**: Live message delivery and read status
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS

## 🏗️ Architecture

- **Backend**: FastAPI + SQLAlchemy + SQLite/PostgreSQL
- **Frontend**: Next.js 14 + TypeScript + React Query + Zustand
- **AI Integration**: Llama4 API for message transformation
- **Authentication**: JWT tokens + Google OAuth
- **Real-time**: REST API with polling (WebSocket support ready)

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Clone and navigate to backend**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**:
   Create a `.env` file in the backend directory:
   ```env
   # Required API Keys
   LLAMA_API_KEY=your-llama-api-key-here
   GOOGLE_CLIENT_ID=your-google-client-id-here
   GOOGLE_CLIENT_SECRET=your-google-client-secret-here
   
   # Security (generate a strong secret key)
   SECRET_KEY=your-super-secret-key-here
   
   # Database (optional - uses SQLite by default)
   DATABASE_URL=sqlite:///./agent_chat.db
   ```

4. **Start the backend server**:
   ```bash
   PYTHONPATH=/path/to/your/project/backend python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev -- -p 3001
   ```

### Access the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🔧 Configuration

### Getting API Keys

1. **Llama API Key**:
   - Visit [Llama API](https://llama.com/)
   - Sign up and get your API key
   - Add to `.env` file

2. **Google OAuth**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add `http://localhost:8000/api/auth/google/callback` as redirect URI
   - Add client ID and secret to `.env` file

### Environment Variables

Create a `.env` file in the backend directory with these variables:

```env
# Required
LLAMA_API_KEY=your-llama-api-key-here
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
SECRET_KEY=your-super-secret-key-here

# Optional
DATABASE_URL=sqlite:///./agent_chat.db
REDIS_URL=redis://localhost:6379
DEBUG=True
```

## 📱 Usage

1. **Register/Login**: Create an account or use Google OAuth
2. **Find Friends**: All registered users appear in the left sidebar
3. **Start Chatting**: Click on any user to start a conversation
4. **Choose Your Tone**: Select an AI agent tone from the dropdown
5. **Custom Prompts**: Use "Custom" tone to write your own transformation prompt
6. **Send Messages**: Your messages are transformed by AI before being sent
7. **Real-time Chat**: Messages appear instantly with read status

## 🛠️ Development

### Project Structure

```
A2A-meta-hack/
├── backend/
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── database/      # Database models and connection
│   │   ├── services/      # Business logic
│   │   └── main.py        # FastAPI app
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/              # Utilities and API client
│   ├── stores/           # Zustand state management
│   └── package.json
└── README.md
```

### Key Components

- **ChatService**: Handles message transformation using Llama API
- **AuthService**: Manages JWT and Google OAuth authentication
- **ChatInterface**: Main chat UI component
- **UsersList**: Friends list with unread message counts

## 🔒 Security

- API keys are stored in environment variables
- JWT tokens for session management
- CORS configuration for frontend-backend communication
- Input validation and sanitization
- Secure password hashing

## 🚧 Known Issues

- WebSocket implementation is prepared but currently uses polling
- Google OAuth requires proper domain setup for production
- Rate limiting not implemented for AI API calls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter issues:

1. Check that all environment variables are set correctly
2. Ensure both servers are running on correct ports (8000 & 3001)
3. Verify API keys are valid and have proper permissions
4. Check browser console for frontend errors
5. Review backend logs for API errors

## 🔮 Future Enhancements

- WebSocket real-time messaging
- Message editing and deletion
- File sharing and media messages
- Group chat functionality
- Message encryption
- Mobile app development
- Voice message transformation 
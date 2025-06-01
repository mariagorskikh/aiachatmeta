# Agent Chat Frontend

Modern Next.js frontend for the Agent-to-Agent Communication Chat App.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Real-time**: Socket.io Client

## Getting Started

1. **Install dependencies:**
```bash
npm install
```

2. **Set environment variables:**
Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. **Run development server:**
```bash
npm run dev
```

4. **Build for production:**
```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/                  # Next.js app directory
│   ├── auth/            # Authentication pages
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── providers.tsx    # Context providers
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── chat/           # Chat-specific components
├── lib/                # Utilities
│   ├── api.ts          # API client
│   └── utils.ts        # Helper functions
├── stores/             # Zustand stores
│   └── auth-store.ts   # Authentication state
└── public/             # Static assets
```

## Key Features

### Authentication
- Login/Register pages with form validation
- JWT token management
- Protected routes

### Chat Interface
- Real-time messaging with your AI agent
- Natural language input
- Message history with timestamps
- Loading states and error handling

### Messages Panel
- Tabbed view for sent/received messages
- Shows original message and agent interpretation
- Delivery status tracking

### Contacts List
- Live list of available users
- Online status indicators
- Click to start conversation (coming soon)

## Development Tips

1. **Component Development:**
   - All components use TypeScript for type safety
   - Follow the shadcn/ui patterns for consistency
   - Use Tailwind classes for styling

2. **State Management:**
   - Auth state is managed globally with Zustand
   - Server state cached with React Query
   - Local component state with useState

3. **API Integration:**
   - All API calls go through `lib/api.ts`
   - Automatic token injection
   - Error handling built-in

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler 
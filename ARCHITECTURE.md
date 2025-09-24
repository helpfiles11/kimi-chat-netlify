# Kimi Chat App Architecture Guide

## Overview
This is a complete guide to understanding how your Kimi chat application works, from frontend to backend to deployment.

## 🏗️ High-Level Architecture

```
User Browser → Next.js Frontend → API Route → Kimi AI API
                      ↑                ↓
                 Real-time streaming response
```

## 📁 Project Structure

```
kimi-chat-netlify/
├── src/app/                    # Next.js App Router
│   ├── layout.tsx              # Root layout (wraps all pages)
│   ├── page.tsx                # Main chat interface (homepage)
│   ├── globals.css             # Global Tailwind styles
│   └── api/chat/route.ts       # Backend API for chat
├── netlify.toml                # Netlify deployment config
├── package.json                # Dependencies and scripts
└── CLAUDE.md                   # Development instructions
```

## 🖥️ Frontend (React/Next.js)

### How the Chat Interface Works

1. **Component Structure**: `src/app/page.tsx`
   - Uses Next.js 15 with App Router
   - Client component (runs in browser)
   - Built with React functional components

2. **Chat Logic**: Powered by `useChat` hook
   ```typescript
   const { messages, input, handleInputChange, handleSubmit } = useChat({
     api: '/api/chat' // Points to our backend API
   })
   ```

3. **State Management**:
   - `messages`: Array of all chat history (user + AI responses)
   - `input`: Current text in input field
   - `handleInputChange`: Updates input as user types
   - `handleSubmit`: Sends message when form submitted

4. **Real-time Updates**:
   - AI responses stream in word-by-word
   - UI updates automatically as AI "types"
   - No manual state management needed

### User Interaction Flow

1. User types message in input field
2. Clicks "Send" button or presses Enter
3. `handleSubmit` triggers automatically
4. Message appears instantly in chat
5. Loading indicator shows (handled by `useChat`)
6. AI response streams in real-time
7. Response completes and is added to history

## ⚙️ Backend (API Route)

### How the API Works

1. **Location**: `src/app/api/chat/route.ts`
2. **Purpose**: Proxy between frontend and Kimi AI
3. **Benefits**:
   - Keeps API keys secret (server-side only)
   - Avoids CORS issues
   - Enables streaming to frontend

### Request Flow

```
Frontend POST → API Route → Kimi API → Stream Response → Frontend
```

### Code Walkthrough

1. **Setup**:
   ```typescript
   const openai = new OpenAI({
     apiKey: process.env.MOONSHOT_API_KEY!,
     baseURL: 'https://api.moonshot.ai/v1', // Kimi's endpoint
   })
   ```

2. **Request Processing**:
   ```typescript
   const { messages } = await req.json() // Extract chat history
   ```

3. **API Call**:
   ```typescript
   const response = await openai.chat.completions.create({
     model: 'kimi-k2-0711-preview',
     stream: true, // Enable streaming
     messages,     // Send full conversation
   })
   ```

4. **Response Streaming**:
   ```typescript
   const stream = OpenAIStream(response)
   return new StreamingTextResponse(stream)
   ```

## 🔄 How Streaming Works

### Technical Implementation

1. **Backend**: Creates server-sent events stream
2. **Frontend**: `useChat` hook consumes stream
3. **Result**: Text appears word-by-word in real-time

### Benefits of Streaming
- Better user experience (immediate feedback)
- Appears more conversational
- Reduces perceived latency
- Handles long responses gracefully

## 🚀 Deployment (Netlify)

### Configuration

1. **Build Settings** (`netlify.toml`):
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"

   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```

2. **Environment Variables**:
   - `MOONSHOT_API_KEY`: Your Kimi API key (set in Netlify dashboard)

### Deployment Process

1. Code pushed to Git repository
2. Netlify detects changes automatically
3. Runs `npm run build`
4. Deploys to global CDN
5. API routes become serverless functions

## 🔧 Development Workflow

### Local Development

1. **Setup**:
   ```bash
   npm install                    # Install dependencies
   cp .env.local.example .env.local  # Set up environment variables
   # Add MOONSHOT_API_KEY to .env.local
   ```

2. **Development**:
   ```bash
   npm run dev     # Start dev server (localhost:3000)
   npm run build   # Test production build
   npm run lint    # Check code quality
   ```

### Key Dependencies

- **Next.js**: React framework with App Router
- **AI SDK v3**: Streaming chat functionality (`useChat` hook)
- **OpenAI SDK v4**: Compatible with Kimi API
- **Tailwind CSS**: Utility-first styling
- **TypeScript**: Type safety

## 🔐 Security Considerations

1. **API Key Protection**:
   - Stored server-side only (`process.env`)
   - Never exposed to browser
   - Different keys for dev/production

2. **Input Validation**:
   - API route validates message format
   - Frontend prevents empty submissions

3. **Rate Limiting**:
   - Consider adding rate limiting for production
   - Netlify functions have built-in timeouts

## 🛠️ Common Customizations

### Adding New Models

In `src/app/api/chat/route.ts`:
```typescript
model: 'kimi-k1-latest' // Change to different Kimi model
```

### Styling Changes

- Global styles: `src/app/globals.css`
- Component styles: Tailwind classes in JSX
- Custom fonts: Already using Geist fonts

### Adding Features

Common additions:
- Message timestamps
- User avatars
- Chat history persistence
- Export conversations
- System prompts

## 🐛 Troubleshooting

### Build Errors
- Check environment variables are set
- Ensure compatible package versions
- Run `npm run lint` for code issues

### Runtime Errors
- Verify `MOONSHOT_API_KEY` is valid
- Check Netlify function logs
- Test API connection directly

### UI Issues
- Check browser console for errors
- Verify Tailwind classes are loading
- Test in different browsers

This architecture provides a solid foundation for a production-ready AI chat application with real-time streaming capabilities.
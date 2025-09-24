# Kimi Chat Application

[![Netlify Status](https://api.netlify.com/api/v1/badges/52cff13c-ef4d-478b-ade2-c2a8ce2e837b/deploy-status)](https://app.netlify.com/projects/kimichatapp/deploys)

A modern, real-time AI chat application built with Next.js 15 and integrated with Kimi AI (Moonshot AI). Features streaming responses, responsive design, and seamless deployment on Netlify.

## Screenshots

### Main Chat Interface
![Chat Interface](screenshots/chat-interface.png)
*Real-time streaming responses with copy functionality and context system*

### Features Overview
![Features Overview](screenshots/features-overview.png)
*Model selection, context input, and conversation management tools*

## Features

- **Real-time Streaming**: AI responses appear word-by-word as they are generated
- **Advanced Model Selection**: Choose from latest Kimi K2 models with 1T parameters and 256K context
- **Copy Functionality**: One-click copy of AI responses with visual feedback
- **Context System**: Provide additional context, documents, or instructions to enhance AI responses
- **Modern UI**: Clean, responsive interface built with Tailwind CSS with dark mode support
- **Password Protection**: Simple authentication system protects your API usage
- **Serverless Architecture**: API routes deployed as serverless functions
- **Type Safety**: Full TypeScript implementation
- **Production Ready**: Optimized for performance and scalability

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **AI Integration**: Kimi AI via OpenAI-compatible API
- **Streaming**: Vercel AI SDK v3
- **Deployment**: Netlify with serverless functions
- **Development**: ESLint, TypeScript strict mode

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with global styles
│   ├── page.tsx            # Main chat interface
│   ├── globals.css         # Global Tailwind styles
│   └── api/
│       └── chat/
│           └── route.ts    # Chat API endpoint
├── netlify.toml            # Netlify deployment configuration
└── package.json           # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Kimi AI API key from [Moonshot AI Platform](https://platform.moonshot.cn/)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/helpfiles11/kimichatapp.git
cd kimichatapp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Add your configuration to `.env.local`:
```
MOONSHOT_API_KEY=your_kimi_api_key_here
AUTH_PASSWORD=your_secure_password_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Setup (Alternative)

If you prefer using Docker for development:

1. Build the Docker image:
```bash
docker build -t kimi-chat-app .
```

2. Run the container with environment variables:
```bash
docker run -p 3000:3000 \
  -e MOONSHOT_API_KEY=your_kimi_api_key_here \
  -e AUTH_PASSWORD=your_secure_password_here \
  -v $(pwd):/app \
  -v /app/node_modules \
  kimi-chat-app
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

The Docker setup includes:
- Development environment with hot reload
- Volume mounting for live code changes
- Proper environment variable injection
- Optimized build with `.dockerignore`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## AI Models (Official from Moonshot API)

**12 Official Models Available** - Directly sourced from `https://api.moonshot.ai/v1/models`:

| Model ID | Name | Badge | Description | Special Features |
|----------|------|-------|-------------|------------------|
| `kimi-latest` | **Kimi Latest** 🌟 | Latest | Always the newest and most advanced Kimi model | Auto-updates to latest |
| `moonshot-v1-auto` | **Auto-Select** ⭐ | Smart | Automatically selects the best model for your task | Intelligent routing |
| `kimi-k2-turbo-preview` | **Kimi K2 Turbo** ⚡ | Turbo | Fastest K2 model with optimized speed | Speed optimized |
| `kimi-k2-0905-preview` | **Kimi K2 (Sept 2024)** 🚀 | Enhanced | September 2024 K2 with enhanced performance | Latest K2 features |
| `kimi-thinking-preview` | **Kimi Thinking** 🤔 | Reasoning | Advanced reasoning with step-by-step thinking | Chain-of-thought |
| `moonshot-v1-128k` | **Moonshot V1 (128K)** 📚 | Large Context | 128K token context for long documents | Extended context |
| `moonshot-v1-32k-vision-preview` | **Vision (32K)** 👁️ | Vision | Image understanding + 32K context | Multimodal |
| `moonshot-v1-32k` | **Moonshot V1 (32K)** 📄 | Extended | 32K token context for conversations | Balanced |
| `moonshot-v1-8k` | **Moonshot V1 (8K)** ⚡ | Fast | 8K context optimized for speed | Fast response |

### 🎯 Additional Models Available via API
- `kimi-k2-0711-preview` - July 2024 K2 preview
- `moonshot-v1-8k-vision-preview` - 8K vision model
- `moonshot-v1-128k-vision-preview` - 128K vision model

### Kimi K2 Capabilities
- **Mixture-of-Experts Architecture**: 1 trillion parameters with 32 billion activated
- **256K Context Length**: Handle extremely long documents and conversations
- **Tool Calling**: Advanced agentic capabilities for autonomous problem-solving
- **Coding Excellence**: State-of-the-art performance in coding benchmarks
- **Frontier Knowledge**: Superior performance in math, reasoning, and complex tasks

**⭐ Recommended**:
- `kimi-latest` - Always gets the newest model automatically
- `moonshot-v1-auto` - Intelligent model selection for your task
- `kimi-k2-turbo-preview` - Fastest performance
- `kimi-thinking-preview` - Complex reasoning tasks

## Deployment

### Netlify (Recommended)

1. Connect your GitHub repository to Netlify
2. Set the build command: `npm run build`
3. Set the publish directory: `.next`
4. Add environment variable `MOONSHOT_API_KEY` in Netlify dashboard
5. Deploy automatically on every commit

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MOONSHOT_API_KEY` | Your Kimi AI API key | Yes |
| `AUTH_PASSWORD` | Password to access the chat interface | Yes |

## Architecture Overview

### Frontend
- **Component Structure**: React functional components with hooks
- **State Management**: Built-in `useChat` hook manages conversation state
- **Real-time Updates**: Streaming responses update UI incrementally
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Backend
- **API Routes**: Next.js API routes handle chat requests
- **Streaming**: Server-sent events for real-time response delivery
- **Security**: API keys stored securely in environment variables
- **Error Handling**: Comprehensive error handling and logging

### Data Flow
1. User submits message through React form
2. Frontend sends POST request to `/api/chat`
3. API route forwards request to Kimi AI
4. Streaming response flows back to frontend
5. UI updates in real-time as response generates

## Authentication System

The app includes a simple password protection system to prevent unauthorized access to your API tokens:

### How It Works
1. **Password Protection**: Users must enter a password before accessing the chat
2. **Session-based**: Authentication persists until browser session ends
3. **API Protection**: Chat API endpoints require authentication headers
4. **Environment-based**: Password stored securely in environment variables

### Setup for Production
1. Set `AUTH_PASSWORD` in your Netlify environment variables
2. Choose a secure password (recommended: 12+ characters)
3. Share the password only with authorized users
4. The password protects your API usage and prevents abuse

## Security Considerations

- API keys stored in environment variables only
- Password protection prevents unauthorized API usage
- No sensitive data exposed to client-side code
- Comprehensive `.gitignore` prevents credential leaks
- Input validation on both frontend and backend
- CORS handling through Next.js API routes

## Performance Optimizations

- Next.js App Router for optimal performance
- Static asset optimization
- Streaming reduces perceived latency
- Efficient re-rendering with React hooks
- Production build optimization

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires modern browser with support for:
- ES2017 features
- Fetch API
- Server-sent events

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For questions or support, please open an issue on GitHub.

## Acknowledgments

- [Kimi AI](https://kimi.moonshot.cn/) for providing the AI capabilities
- [Vercel AI SDK](https://sdk.vercel.ai/) for streaming functionality
- [Next.js](https://nextjs.org/) for the React framework
- [Tailwind CSS](https://tailwindcss.com/) for styling utilities

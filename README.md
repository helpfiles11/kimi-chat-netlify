# Kimi Chat Application

[![Netlify Status](https://api.netlify.com/api/v1/badges/52cff13c-ef4d-478b-ade2-c2a8ce2e837b/deploy-status)](https://app.netlify.com/projects/kimichatapp/deploys)

A modern, real-time AI chat application built with Next.js 15 and integrated with Kimi AI (Moonshot AI). Features streaming responses, responsive design, and seamless deployment on Netlify.

## Screenshots

### Main Chat Interface
![Chat Interface](screenshots/chat-interface.png)
*Real-time streaming responses with copy functionality, token consumption counter and context system*

## Features

### Advanced AI Capabilities
- **Tool Calling System**: AI can execute code, solve math problems, analyze data, and search the web
- **Real-time Web Search**: K2 models can access current information and news via WebSearch tool
- **Real-time Streaming**: Word-by-word response generation
- **12 Official Models**: Including latest Kimi K2 family with 1T parameters

### Cost Transparency
- **Live Token Estimation**: See costs before sending requests
- **Account Balance**: Real-time balance monitoring with auto-refresh
- **Usage Analytics**: Track spending and optimize usage patterns

### File Processing
- **Smart Upload**: Local (1MB) or server-side (100MB) processing
- **Multiple Formats**: Text, code, markdown, PDF, and more
- **Drag & Drop**: Intuitive file handling interface

### Professional UI
- **Modern Design**: Clean interface with dark mode
- **Responsive**: Works perfectly on all devices
- **Copy & Export**: Save conversations and responses

## Technology Stack

- **Frontend**: Next.js 15.5, React 19, TypeScript 5
- **Styling**: Tailwind CSS v4 with CSS-in-JS
- **AI Integration**: Moonshot AI via OpenAI-compatible SDK v4
- **Tool System**: Custom tool calling with code execution and web search
- **File Processing**: Multi-format support with server upload
- **Streaming**: Vercel AI SDK v3 with real-time responses
- **Cost Tracking**: Token estimation and balance monitoring
- **Deployment**: Netlify with Edge Functions, Docker support
- **Development**: ESLint 9, TypeScript strict mode, Node.js 20

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with global styles
│   ├── page.tsx            # Main chat interface with tool calling
│   ├── globals.css         # Global Tailwind styles
│   └── api/
│       ├── auth/           # Authentication system
│       ├── chat/           # Enhanced chat with tool support
│       ├── balance/        # Account balance checking
│       ├── estimate-tokens/# Token cost estimation
│       ├── upload-file/    # File upload to Moonshot API
│       └── tools/          # Tool execution endpoints
│           ├── websearch/  # Web search for real-time information
│           ├── calculator/ # Mathematical operations
│           └── code-runner/# Code execution (JS/Python)
├── components/
│   ├── CopyButton.tsx      # Response copy functionality
│   ├── FileUpload.tsx      # Local file processing
│   ├── EnhancedFileUpload.tsx # Dual-mode file handling
│   └── UsageInfo.tsx       # Balance and token display
├── netlify.toml            # Netlify deployment config
├── Dockerfile              # Multi-stage Docker setup
└── package.json           # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 20 or higher (recommended for Next.js 15)
- npm, yarn, or pnpm
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

Multi-stage Docker setup for both development and production:

**Development:**
```bash
# Build development image
docker build --target development -t kimi-chat-dev .

# Run development container with hot reload
docker run -p 3000:3000 \
  -e MOONSHOT_API_KEY=your_api_key_here \
  -e AUTH_PASSWORD=your_password_here \
  -v $(pwd):/app \
  -v /app/node_modules \
  kimi-chat-dev
```

**Production:**
```bash
# Build production image
docker build --target production -t kimi-chat-prod .

# Run production container
docker run -p 3000:3000 \
  -e MOONSHOT_API_KEY=your_api_key_here \
  -e AUTH_PASSWORD=your_password_here \
  kimi-chat-prod
```

**Features:**
- Node.js 20 Alpine for optimal performance
- Multi-stage builds for smaller production images
- Non-root user for enhanced security
- Hot reload in development mode

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## AI Models (Official from Moonshot API)

**12 Official Models Available** - Directly sourced from `https://api.moonshot.ai/v1/models`:

| Model ID | Name | Badge | Description | Special Features |
|----------|------|-------|-------------|------------------|
| `kimi-k2-turbo-preview` | **Kimi K2 Turbo** | Turbo | Fastest K2 model with optimized speed | Speed optimized |
| `kimi-k2-0905-preview` | **Kimi K2 (Sept 2024)** | Enhanced | September 2024 K2 with enhanced performance | Latest K2 features |
| `kimi-latest` | **Kimi Latest** | Latest | Always the newest and most advanced Kimi model | Auto-updates to latest |
| `kimi-thinking-preview` | **Kimi Thinking** | Reasoning | Advanced reasoning with step-by-step thinking | Chain-of-thought |
| `moonshot-v1-auto` | **Auto-Select (Moonshot only)** | Smart | Selects best Moonshot model - cannot exceed K2 family | Intelligent routing |
| `moonshot-v1-32k-vision-preview` | **Vision (32K)** | Vision | Image understanding + 32K context | Multimodal |
| `moonshot-v1-128k` | **Moonshot V1 (128K)** | Large Context | 128K token context for long documents | Extended context |
| `moonshot-v1-32k` | **Moonshot V1 (32K)** | Extended | 32K token context for conversations | Balanced |
| `moonshot-v1-8k` | **Moonshot V1 (8K)** | Fast | 8K context optimized for speed | Fast response |

### Additional Models Available via API
- `kimi-k2-0711-preview` - July 2024 K2 preview
- `moonshot-v1-8k-vision-preview` - 8K vision model
- `moonshot-v1-128k-vision-preview` - 128K vision model

### Kimi K2 Capabilities
- **Mixture-of-Experts Architecture**: 1 trillion parameters with 32 billion activated
- **256K Context Length**: Handle extremely long documents and conversations
- **Tool Calling**: Advanced agentic capabilities for autonomous problem-solving
- **Coding Excellence**: State-of-the-art performance in coding benchmarks
- **Frontier Knowledge**: Superior performance in math, reasoning, and complex tasks

## Available Tools for AI Models

The application provides powerful tool calling capabilities, especially optimized for Kimi K2 models:

### WebSearch Tool
- **Real-time Information**: Access current news, facts, and live data
- **Search Integration**: Uses DuckDuckGo API for reliable results
- **Smart Fallbacks**: Graceful handling when search services are unavailable
- **Best for**: Current events, recent developments, fact-checking

### CodeRunner Tool
- **JavaScript & Python**: Execute code safely in sandboxed environment
- **Data Analysis**: Perfect for calculations, algorithms, and data processing
- **Security**: Isolated execution with content filtering
- **Best for**: Programming tasks, complex calculations, data analysis

### Calculator Tool
- **Mathematical Operations**: Arithmetic, algebra, trigonometry, statistics
- **Multiple Operations**: Evaluate, solve, simplify, derivatives, integrals
- **High Precision**: Reliable mathematical computations
- **Best for**: Mathematical problems, formula evaluation

### TextAnalyzer Tool
- **Sentiment Analysis**: Understand emotional tone of text
- **Keyword Extraction**: Identify important terms and themes
- **Statistics**: Word count, readability metrics, language detection
- **Best for**: Content analysis, writing improvement, text insights

### DataProcessor Tool
- **Format Support**: CSV, JSON, structured data processing
- **Operations**: Parse, filter, sort, aggregate, visualize data
- **Statistical Analysis**: Comprehensive data insights
- **Best for**: Data manipulation, report generation, analytics

### Tool Usage Tips
- **K2 Models**: Automatically determine when and how to use tools
- **Context Aware**: Tools work with your conversation context
- **Chained Operations**: AI can use multiple tools in sequence
- **Error Handling**: Robust error recovery and user feedback

### Tool Calling Status
- **Tool Endpoints**: All tool APIs (WebSearch, CodeRunner, Calculator, etc.) are fully functional
- **Client-Side Intent Detection**: Revolutionary approach bypasses Netlify timeout limitations
- **Real-Time Execution**: Tools execute while AI is typing for native user experience
- **Tool Integration**: Clean results display with formatted output cards
- **Performance**: Sub-500ms tool execution vs 8+ seconds with traditional approaches

### How Tool Calling Works (Client-Side Intent Injection)
1. **AI Response Streaming**: K2 models start streaming natural language responses
2. **Intent Detection**: Client-side regex patterns detect tool usage intent in real-time
3. **Immediate Execution**: Tools execute via `/api/execTool` while AI is still "typing"
4. **Content Cleaning**: Raw tool call JSON is filtered from AI responses for clean UX
5. **Results Display**: Tool results appear as formatted cards below AI messages
6. **Native Performance**: Total latency ~300-500ms, feels instant to users

### Client-Side Intent Detection Implementation

Revolutionary approach that bypasses traditional Partial Mode limitations:

#### Core Innovation
- **Skip Completion Entirely**: No need for slow server-side completion requests
- **Instant Recognition**: Detect tool intent from streaming natural language
- **Netlify Compatible**: Stays within 10-second edge function limits
- **No API Key Exposure**: All tool execution happens server-side

#### Technical Implementation
```typescript
// 1. Client-side intent detection patterns
const INTENT_PATTERNS = {
  WebSearch: /\b(search|look up|google|find)\b.*?\b(for|about|regarding)\b/i,
  Calculator: /\b(calculate|compute|solve|evaluate)\b/i,
  CodeRunner: /\b(run|execute|code)\b.*?\b(python|javascript)\b/i
};

// 2. Real-time streaming interception
useEffect(() => {
  const newChunk = currentContent.slice(currentResponse.current.length);
  const toolIntent = detectIntent(newChunk);

  if (toolIntent) {
    // Execute immediately while AI is still typing
    executeTool(toolIntent, lastMessage.id);
  }
}, [messages]);

// 3. Fast tool execution endpoint
POST /api/execTool
{
  "name": "WebSearch",
  "arguments": { "query": "comet 3I atlas size" },
  "id": "client_1234567890_xyz"
}

// 4. Clean UI display
const cleanContent = content
  .replace(/\{"tool_calls":\s*\[([\s\S]*?)\]\}/g, '')
  .trim();
```

#### Performance Benefits
- **Sub-500ms Execution**: Tools run while AI streams response
- **No Timeouts**: Eliminates 8+ second Partial Mode completion delays
- **Native Feel**: Users see tools execute in real-time
- **Netlify Optimized**: Works perfectly on free tier edge functions

### Example Tool Usage

**Web Search Example:**
```
User: "Search for the comet 3I atlas and tell me how big it is"
→ AI automatically uses WebSearch tool
→ Searches for current information about comet 3I/Borisov
→ Integrates search results into comprehensive answer
```

**Code Execution Example:**
```
User: "Calculate the Fibonacci sequence up to 100"
→ AI uses CodeRunner tool to write and execute Python code
→ Returns both the code and execution results
```

**Combined Tool Usage:**
```
User: "Search for current Bitcoin price and calculate ROI on a $1000 investment from last year"
→ AI uses WebSearch for current price
→ Then uses CodeRunner for calculations
→ Provides complete analysis with current data
```

**Recommended**:
- `kimi-k2-turbo-preview` - Best performance with fastest speed
- `kimi-k2-0905-preview` - Latest K2 features and enhanced capabilities
- `kimi-latest` - Always gets the newest model automatically
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

- Chrome 100+
- Firefox 100+
- Safari 15+
- Edge 100+

Requires modern browser with support for:
- ES2022 features (for React 19)
- Fetch API and FormData
- Server-sent events (for streaming)
- File API (for drag & drop uploads)

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

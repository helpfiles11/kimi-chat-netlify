# Changelog

## [Unreleased] - 2024-12-XX

### Added
- **Latest Kimi K2 Models**: Updated to 2024's most advanced AI models
  - Kimi K2 Instruct with 1T parameters and 256K context
  - Tool calling and agentic capabilities
  - Enhanced coding and reasoning performance
  - Visual model badges and improved selection UI

- **Enhanced Features**: Comprehensive user experience improvements
  - Conversation export (download as .txt file)
  - Message count tracking
  - Clear conversation functionality
  - Enhanced error handling and input validation
  - Conversation management tools in header

- **Security & Performance**: Major optimization and security improvements
  - Request size validation (100KB limit)
  - Model allowlist validation
  - Message content length limits (50K per message)
  - Context length validation (10K limit)
  - Optimized badge rendering logic
  - Bundle size: 22.3kB (+1.7kB total for all features)

- **Context System**: Provide additional context to enhance AI responses
  - Persistent context textarea (10,000 character limit)
  - localStorage persistence across browser sessions
  - Context injected as system messages in API calls
  - Visual feedback when context is active
  - Character counter with color-coded warnings
  - Clear context button

- **Copy Functionality**: One-click copy of AI responses with visual feedback
  - Native clipboard API implementation (no external dependencies)
  - Hover-to-reveal copy button on AI messages
  - Visual feedback with checkmark and "Copied!" text
  - Fallback support for older browsers
  - Only 0.8kB bundle size increase

## [Previous] - 2024-12-XX

### Added
- **Dark Mode Support**: Complete dark mode implementation across all UI components
  - Dark theme for chat interface, authentication forms, and all interactive elements
  - Smooth color transitions with `transition-colors duration-200`
  - Proper contrast ratios for accessibility compliance
  - Consistent theming using Tailwind CSS dark mode variants

- **Docker Development Environment**:
  - Dockerfile for containerized development with Node.js 18-alpine
  - .dockerignore file optimized for build context
  - Docker setup instructions in README with environment variable injection
  - Volume mounting for live code changes during development

### Enhanced
- **User Interface**:
  - Improved visual design with better color schemes
  - Enhanced button states and hover effects
  - Better loading states and error displays
  - Improved form styling and accessibility

- **Developer Experience**:
  - Comprehensive Docker development workflow
  - Updated documentation with Docker setup instructions
  - Maintained MIT license compliance

### Technical Details
- All UI components now support both light and dark themes
- Uses CSS custom properties and Tailwind's dark mode system
- Docker container includes hot reload for development efficiency
- Build and lint processes remain unchanged and passing

## Previous Releases
- Authentication system implementation
- AI model selector with multiple Kimi models
- Chat interface with streaming responses
- Password protection for API usage
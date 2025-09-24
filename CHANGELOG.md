# Changelog

## [Unreleased] - 2024-12-XX

### Added
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
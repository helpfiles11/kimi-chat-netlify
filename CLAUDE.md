# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 chat application that integrates with Kimi (Moonshot AI) via OpenAI-compatible API, deployed on Netlify. The app provides a simple chat interface using the `ai/react` streaming hooks.

## Commands

- `npm run dev` - Start development server on localhost:3000
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality

## Architecture

### Core Structure
- **Next.js App Router**: Uses `src/app/` directory structure with TypeScript
- **API Route**: `/api/chat/route.ts` handles chat completions via Kimi API
- **Client Component**: `src/app/page.tsx` implements the chat UI using `useChat` hook
- **Styling**: Tailwind CSS v4 with PostCSS for styling

### Key Dependencies
- `ai` - Vercel AI SDK for streaming chat responses
- `openai` - OpenAI SDK configured for Kimi API endpoint
- `next` - React framework with App Router
- `tailwindcss` - Utility-first CSS framework

### Environment Variables
- `MOONSHOT_API_KEY` - Required API key for Kimi/Moonshot AI service

### Deployment
- Deployed on Netlify using `@netlify/plugin-nextjs`
- Build command: `npm run build`
- Publish directory: `.next`
- Configuration in `netlify.toml`

## File Structure Notes

- `src/app/layout.tsx` - Root layout with Geist fonts
- `src/app/page.tsx` - Main chat interface (client component)
- `src/app/api/chat/route.ts` - Streaming chat API endpoint
- `src/app/globals.css` - Global Tailwind CSS imports
- TypeScript path alias `@/*` maps to `./src/*`
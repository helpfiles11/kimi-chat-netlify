# Static Website Deployment Guide

This repository contains both the main Kimi Chat application and a static project website in the `public/` directory.

## 🌐 Deploy Project Website

To deploy the static project website as a separate Netlify site:

### Option 1: Manual Deployment
1. Create a new site on Netlify
2. Upload the `public/` folder contents
3. Configure custom domain if desired

### Option 2: Git-based Deployment
1. Create a new Netlify site connected to this repo
2. Set build settings:
   - **Build command**: `echo 'Static site ready'`
   - **Publish directory**: `public`
   - **Config file**: `netlify-static.toml`

## ⚙️ Configuration Files

This repository contains two Netlify configuration files:

### `netlify.toml` - Main Next.js Application
- **Purpose**: Deploys the full Kimi Chat application with password login
- **Build**: `npm run build` (Next.js build process)
- **Publish**: `.next` (Next.js output directory)
- **Site**: `kimi-chat.netlify.app`

### `netlify-static.toml` - Static Project Website
- **Purpose**: Deploys only the project information website
- **Build**: `echo 'Static site ready'` (no build needed)
- **Publish**: `public` (static HTML files)
- **Site**: `kimi-chat-info.netlify.app`

## 🔧 Troubleshooting

If your main app shows "Static site ready" error:
1. Verify you're using `netlify.toml` (not `netlify-static.toml`)
2. Check that build command is `npm run build`
3. Ensure publish directory is `.next`

## 📁 Website Structure

```
public/
├── index.html          # Main project website
├── favicon.ico         # Site icon (if added)
└── images/            # Screenshots (when added)
```

## 🎯 Website Features

- **Responsive design** - Works on all devices
- **Dark/light mode** - Automatic theme switching
- **SEO optimized** - Meta tags, Open Graph, Twitter cards
- **Performance focused** - CDN-ready, optimized loading
- **Accessibility friendly** - Screen reader compatible

## 🔗 Suggested URLs

- **Main app**: `kimi-chat.netlify.app`
- **Project website**: `kimi-chat-info.netlify.app` or custom domain

## 🖼️ Adding Screenshots

Add screenshot images to `public/images/` and update the HTML to include them in the features section.

## 💰 Cost Highlight

The website emphasizes the 93% cost savings compared to other subscription based solutions:
- Others: ususually around $20/month
- Kimi Chat: ~$1.50/month (typical usage with 10.000 tokens/day)
- Access to brand new, feature rich preview models and time based promotions from moonshot.cn

Perfect for attracting cost-conscious users! 🎯

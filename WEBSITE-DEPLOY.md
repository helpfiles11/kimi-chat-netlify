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
   - **Config file**: `netlify-website.toml`

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
- Other: ususually around $20/month
- Kimi Chat: ~$1.50/month (typical usage with 10.000 tokens/day)
- Access to brand new, feature rich preview models and time based promotions from moonshot.cn

Perfect for attracting cost-conscious users! 🎯

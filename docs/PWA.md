# PWA Setup Guide

This project has full Progressive Web App (PWA) support enabled. Here's what's included and how to use it.

## Features

✅ **Web App Manifest** - App metadata, icons, and installability  
✅ **Service Worker** - Automatic caching and offline support  
✅ **Offline Fallback** - Custom offline page at `/offline`  
✅ **Install Prompt** - Smart install prompt for iOS and Android  
✅ **Offline Indicator** - Visual indicator when offline  
✅ **Asset Caching** - Images, fonts, and static assets cached  
✅ **API Caching** - API responses cached with NetworkFirst strategy  
✅ **Mobile Optimizations** - Touch-friendly UI, safe area insets, fullscreen mode  

## Icon Generation

Icons are automatically generated from `public/funoon-logo.webp`. To regenerate icons:

```bash
npm run generate-icons
```

This will create all required icon sizes:
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
- Apple touch icon (180x180)

## Service Worker

The service worker is automatically generated during build and registered on app load. It includes:

- **NetworkFirst** strategy for HTML pages and API calls
- **CacheFirst** strategy for images and static assets
- **Offline fallback** to `/offline` page
- **Automatic updates** with skipWaiting enabled

## Testing PWA Features

### Local Development

1. Build the app: `npm run build`
2. Start production server: `npm start`
3. Open in Chrome/Edge
4. Open DevTools > Application > Service Workers
5. Check "Offline" to test offline mode

### Mobile Testing

1. Deploy to a server (required for PWA)
2. Open on mobile device
3. Use "Add to Home Screen" option
4. Test offline functionality

## Installation

### Android/Chrome
- Visit the site
- Tap the menu (3 dots)
- Select "Install app" or "Add to Home Screen"
- Or use the install prompt that appears

### iOS/Safari
- Visit the site
- Tap the Share button
- Scroll and tap "Add to Home Screen"
- Or follow the instructions in the install prompt

## Offline Support

When offline:
- Previously visited pages are available from cache
- API calls use cached responses when available
- Offline indicator appears at top of screen
- Custom offline page shown for uncached routes

## Configuration

### Manifest (`public/manifest.json`)
- App name, theme color, display mode
- Icons and screenshots
- Shortcuts for quick access
- Share target configuration

### Service Worker (`next.config.ts`)
- Caching strategies per resource type
- Cache expiration times
- Network timeout settings

### Customization

Edit these files to customize:
- `public/manifest.json` - App metadata
- `next.config.ts` - Caching strategies
- `src/app/offline/page.tsx` - Offline page design
- `src/components/pwa-install-prompt.tsx` - Install prompt UI

## Build Notes

- Service worker is **disabled in development** (set `disable: false` in `next.config.ts` to enable)
- Service worker files are generated in `public/` during build
- Icons must be generated before first build
- HTTPS is required for PWA features (except localhost)

## Troubleshooting

**Service worker not registering:**
- Ensure you're on HTTPS or localhost
- Check browser console for errors
- Clear browser cache and reload

**Icons not showing:**
- Run `npm run generate-icons`
- Check that icons exist in `public/` folder
- Verify manifest.json paths are correct

**Offline mode not working:**
- Build the app first (`npm run build`)
- Service worker only works in production build
- Check Application tab in DevTools

## Performance

PWA features improve:
- **Load time** - Cached assets load instantly
- **Offline access** - Previously visited pages work offline
- **Data usage** - Reduced network requests
- **User experience** - App-like feel on mobile


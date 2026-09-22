# Real-time Updates with Pusher

This project uses Pusher for real-time data synchronization across all portals. Updates to results, assignments, registrations, and students are instantly reflected across all connected clients without page refreshes.

## Features

✅ **Result Updates**: When admins approve/reject results, all connected clients see updates instantly
✅ **Scoreboard Sync**: Homepage, scoreboard, and results pages update in real-time
✅ **Assignment Notifications**: Juries see new program assignments immediately
✅ **Registration Updates**: Student registrations appear instantly for admins and juries
✅ **Student Management**: New students appear everywhere in real-time

## Setup Instructions

### 1. Create a Pusher Account

1. Go to [https://dashboard.pusher.com/](https://dashboard.pusher.com/)
2. Sign up for a free account (or log in if you already have one)
3. Create a new app (choose any name, e.g., "Funoon Fiesta")
4. Select your preferred cluster (e.g., `mt1` for US East)

### 2. Get Your Pusher Credentials

After creating your app, you'll see:
- **App ID** (e.g., `1234567`)
- **Key** (e.g., `abc123def456`)
- **Secret** (e.g., `secret123abc456`)
- **Cluster** (e.g., `mt1`, `eu`, `ap-southeast-1`)

### 3. Configure Environment Variables

Create a `.env.local` file in your project root (if it doesn't exist) and add:

```env
# Pusher Configuration
PUSHER_APP_ID=your_app_id_here
PUSHER_SECRET=your_secret_key_here
NEXT_PUBLIC_PUSHER_KEY=your_public_key_here
NEXT_PUBLIC_PUSHER_CLUSTER=mt1
```

**Important Notes:**
- `PUSHER_APP_ID` and `PUSHER_SECRET` are server-side only (safe to keep private)
- `NEXT_PUBLIC_PUSHER_KEY` and `NEXT_PUBLIC_PUSHER_CLUSTER` are client-side (they'll be exposed in your bundle)
- Replace the example values with your actual Pusher credentials

### 4. Restart Your Development Server

After adding the environment variables:

```bash
npm run dev
```

The real-time system will automatically connect when you visit any page.

## How It Works

### Server-Side (Event Emission)

When data changes occur in server actions, events are automatically emitted:

- **Result Approved** → `result-approved` event
- **Result Rejected** → `result-rejected` event  
- **Result Submitted** → `result-submitted` event
- **Assignment Created** → `assignment-created` event
- **Assignment Deleted** → `assignment-deleted` event
- **Registration Created** → `registration-created` event
- **Registration Deleted** → `registration-deleted` event
- **Student Created/Updated/Deleted** → `student-*` events
- **Scoreboard Updated** → `scoreboard-updated` event

### Client-Side (Event Subscription)

Pages automatically subscribe to relevant channels:

- **Homepage** (`/`) → Subscribes to scoreboard updates
- **Scoreboard** (`/scoreboard`) → Subscribes to scoreboard updates
- **Results** (`/results`) → Subscribes to result updates
- **Pending Results** (`/admin/pending-results`) → Subscribes to result updates
- **Jury Programs** (`/jury/programs`) → Subscribes to assignment updates

When events are received, pages automatically refresh using Next.js's `router.refresh()`.

## Testing Real-time Updates

1. **Open two browser windows/tabs**:
   - Tab 1: Admin portal (e.g., `/admin/pending-results`)
   - Tab 2: Homepage (`/`)

2. **Perform an action in Tab 1**:
   - Approve a pending result
   - Assign a program to a jury
   - Create a new student

3. **Watch Tab 2**:
   - The page should automatically update without manual refresh
   - You should see a connection indicator in the bottom-right (dev mode only)

## Development vs Production

### Development Mode
- Connection status indicator visible in bottom-right corner
- Shows "Real-time Connected" or "Connecting..." status

### Production Mode
- Connection indicator hidden
- Automatic reconnection on network issues
- Works seamlessly in background

## Troubleshooting

### "Real-time Connected" indicator shows "Connecting..." indefinitely

**Possible causes:**
1. Missing or incorrect environment variables
2. Pusher app not created or credentials wrong
3. Network/firewall blocking Pusher connections
4. Cluster mismatch between client and server

**Solutions:**
- Verify all environment variables are set correctly
- Check Pusher dashboard for correct credentials
- Ensure your cluster matches in both `NEXT_PUBLIC_PUSHER_CLUSTER` and Pusher dashboard
- Check browser console for connection errors

### Updates not appearing in real-time

**Possible causes:**
1. Environment variables not loaded (restart dev server)
2. Server action not emitting events
3. Client not subscribed to correct channel

**Solutions:**
- Restart your development server after adding environment variables
- Check server logs for Pusher connection errors
- Verify the page is using a real-time wrapper component
- Check browser console for subscription errors

### Connection works in dev but not in production

**Possible causes:**
1. Environment variables not set in production (Vercel, etc.)
2. Build-time vs runtime environment variables

**Solutions:**
- Ensure all Pusher environment variables are set in your hosting platform
- For Vercel: Add them in Project Settings → Environment Variables
- Ensure `NEXT_PUBLIC_*` variables are available at build time

## Pusher Free Tier Limits

The Pusher free tier includes:
- **200,000 messages/day**
- **100 concurrent connections**
- **Unlimited channels**

For most festivals and events, this is more than sufficient. If you exceed these limits, Pusher offers paid plans.

## Security Considerations

- Server-side credentials (`PUSHER_APP_ID`, `PUSHER_SECRET`) are never exposed to clients
- Client-side credentials (`NEXT_PUBLIC_PUSHER_KEY`) are safe to expose
- Channels are public by default (no authentication required)
- For production, consider implementing Pusher's [Channel Authorization](https://pusher.com/docs/channels/using_channels/channels-authorization/) for private channels

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Server    │────────▶│    Pusher    │────────▶│   Client    │
│  Actions    │  emit   │   Channels   │  push   │   Pages     │
└─────────────┘         └──────────────┘         └─────────────┘
     │                                              │
     │  approveResult()                            │  useResultUpdates()
     │  submitResultToPending()                    │  useScoreboardUpdates()
     │  assignProgramToJury()                      │  router.refresh()
     └──────────────────────────────────────────────┘
```

## Files Modified/Created

### New Files
- `src/lib/pusher.ts` - Server-side Pusher instance and event emitters
- `src/lib/pusher-client.ts` - Client-side Pusher instance
- `src/hooks/use-realtime.ts` - React hooks for subscribing to events
- `src/components/realtime-provider.tsx` - Root provider for Pusher connection
- `src/components/home-realtime.tsx` - Real-time wrapper for homepage
- `src/components/scoreboard-realtime.tsx` - Real-time wrapper for scoreboard
- `src/components/results-realtime.tsx` - Real-time wrapper for results page
- `src/components/pending-results-realtime.tsx` - Real-time wrapper for pending results
- `src/components/jury-programs-realtime.tsx` - Real-time wrapper for jury assignments

### Modified Files
- `src/lib/result-service.ts` - Added event emissions for result operations
- `src/lib/data.ts` - Added event emissions for assignments and students
- `src/lib/team-data.ts` - Added event emissions for registrations and students
- `src/app/layout.tsx` - Added RealtimeProvider
- `src/app/page.tsx` - Updated to use HomeRealtime component
- `src/app/scoreboard/page.tsx` - Updated to use ScoreboardRealtime component
- `src/app/results/page.tsx` - Updated to use ResultsRealtime component
- `src/app/admin/(secure)/pending-results/page.tsx` - Updated to use PendingResultsRealtime component
- `src/app/jury/(secure)/programs/page.tsx` - Updated to use JuryProgramsRealtime component

## Next Steps

1. Set up your Pusher account and add credentials to `.env.local`
2. Test real-time updates by opening multiple browser tabs
3. Monitor Pusher dashboard for message counts and connection stats
4. Consider upgrading to a paid plan if you exceed free tier limits

For more information, visit [Pusher Documentation](https://pusher.com/docs/).











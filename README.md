# 🎪 Ma'erika 2K26 — Dars Fest Management System

A high-performance, real-time web application built for managing the **Dars Fest (Ma'erika 2K26)** arts and cultural competition. Featuring live scoreboards, program scheduling, team and student management, jury result scoring, PWA offline support, AI chatbot assistant, and instant result poster generation.

---

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router, Server Actions)
- **UI & Styling**: React 19, Tailwind CSS 4, Radix UI primitives, Lucide Icons, Framer Motion
- **Database & ODM**: MongoDB with Mongoose 8
- **Real-Time Engine**: Pusher for instant live score updates and announcements
- **Authentication**: Firebase Admin SDK for session validation
- **PWA**: Next-PWA with offline caching & precached service worker
- **AI Assistant**: Google Gemini API via `@google/generative-ai`

---

## 📁 Project Architecture & Structure

```
Dars-Fest/
├── docs/                       # Feature documentation & guides
│   ├── CHATBOT.md              # AI Chatbot Assistant architecture
│   ├── PARTICIPANT_LOOKUP.md   # Chest number lookup & QR code generation
│   ├── PWA.md                  # Progressive Web App configuration
│   └── REALTIME.md             # Real-time event propagation via Pusher
├── public/                     # Static assets, fonts, PWA icons, manifest
├── scripts/                    # Database migrations and maintenance scripts
│   ├── clear-mock-data.js      # Clean test data from MongoDB
│   ├── generate-icons.js       # PWA icon generator
│   ├── import-students.js      # Batch CSV/JSON student import
│   ├── migrate-to-mongo.js     # Migration script from Firestore to MongoDB
│   └── verify-mongo.js         # MongoDB collections and index validation
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (public)/           # Public pages: /, /schedule, /scoreboard, /results, /top-scorers
│   │   ├── admin/              # Admin control center (dashboard, programs, jury, scoring)
│   │   ├── api/                # API routes (Pusher pulse, chat, attendance, sync)
│   │   ├── chatbot/            # Gemini AI chatbot interactive interface
│   │   ├── jury/               # Jury portal for entering scores
│   │   ├── participant/        # Chest number & QR participant search
│   │   └── team/               # Team leader portal & registration
│   ├── components/             # Reusable UI components & feature managers
│   │   ├── admin-sidebar.tsx   # Admin dashboard collapsible navigation
│   │   ├── forms/              # Login and entry forms
│   │   └── ui/                 # Core atomic UI primitives
│   ├── hooks/                  # Custom React hooks (realtime, debounce, container resize)
│   └── lib/                    # Core business logic & database services
│       ├── auth.ts             # Auth tokens and session validation
│       ├── db.ts               # MongoDB connection client
│       ├── models.ts           # Mongoose schemas & MongoModelWrapper
│       ├── pusher.ts           # Pusher server event broadcast
│       ├── pusher-client.ts    # Pusher client channel listener
│       ├── result-service.ts   # Result calculation & approval logic
│       ├── top-scorer-service.ts # Aggregated points & ranking engine
│       └── types.ts            # Core TypeScript data contracts
└── next.config.ts              # Next.js + PWA configuration
```

---

## 🛠️ Getting Started

### 1. Environment Configuration

Create a `.env` file in the project root based on `.env.example`:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/dars-fest?retryWrites=true&w=majority

# Pusher Realtime
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=ap2
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=ap2

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Firebase Auth (Admin SDK)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 2. Install Dependencies & Run

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts development server |
| `npm run build` | Compiles optimized production bundle |
| `npm run start` | Runs production server |
| `npm run lint` | Runs ESLint validation |
| `npm run migrate:mongo` | Migrates data to MongoDB |
| `npm run verify:mongo` | Tests and verifies MongoDB collections |
| `npm run clear-mock-data` | Resets development data |
| `npm run generate-icons` | Generates PWA icon set |

---

## 📚 Detailed Documentation

- [Real-time System & Pusher Integration](docs/REALTIME.md)
- [PWA & Offline Service Worker](docs/PWA.md)
- [AI Chatbot Guide](docs/CHATBOT.md)
- [Participant Lookup & QR Badges](docs/PARTICIPANT_LOOKUP.md)

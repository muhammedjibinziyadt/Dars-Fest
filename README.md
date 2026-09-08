# 🌟 Maerika 2K26 
### കലായുഗ ഭാവുകം &bull; Arts & Cultural Festival Management Platform
**Organized by Jawharathul Uloom Suffa Dars**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Resend](https://img.shields.io/badge/Resend-Email_API-black?style=for-the-badge&logo=resend)](https://resend.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75B2?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![PWA](https://img.shields.io/badge/PWA-Ready-green?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps/)

---

## 📖 Overview

**Maerika 2K26** is an enterprise-grade, full-stack festival automation platform built for managing large-scale Arts and Cultural Competitions. The platform unifies real-time scoring, jury evaluations, team squad management, automated participant verification, live public scoreboards, interactive audience features, and transactional email communications into a single, high-performance web application.

---

## 🏛️ Dedicated Portals & Architecture

```mermaid
graph TD
    A[Public Portal / Audience] -->|Live Scores & Standings| S[Scoreboard & Results]
    A -->|Interactive| P[Polls, Predictions & AI Chatbot]
    B[Team Leader Portal] -->|Roster & Entries| T[Student & Program Registration]
    C[Jury Deck] -->|Live Judging| J[Program Evaluation & Scoring]
    D[Admin Command Center] -->|Approval & Controls| M[Fest Oversight & Publishing]
    M -->|Email Dispatch via Resend| E[Automated Email Notification Engine]
    M -->|Reports & PDF Exports| R[Printable Reports & Scorecards]
```

### 1. 👑 Admin Command Center (`/admin`)
- **Fest Dashboard**: Real-time statistical overview of teams, participants, programs, and approved results.
- **Team Provisioning**: Provision squad accounts and automatically dispatch portal credentials to team leaders via Resend.
- **Program & Registration Oversight**: Manage stage & off-stage events with category rules, section filters, and strict candidate entry limit validation.
- **Jury Management & Assignments**: Create jury profiles and assign judges to specific competitions.
- **Results Review & Publishing**: Multi-stage approval workflow (Pending ➔ Approved ➔ Live Published) with automated squad point recalculations.
- **Reports & PDF Exports**: High-resolution printable reports, candidate rosters, scoreboard summaries, and exportable data tables.
- **Interactive Management**: Admin controls for community polls, audience predictions evaluation, and festival schedules.

### 2. ⚖️ Jury Scoring Deck (`/jury`)
- **Secure Evaluation Interface**: Judges sign in with credentials to access assigned programs.
- **Chest Number Grading**: Enter candidate marks with instant automated grade calculation (Grade A/B/C/none) and position allocation.
- **Approval Dispatch**: One-click submission directly into the Admin review queue.

### 3. 🛡️ Team Leader Squad Portal (`/team`)
- **Squad Dashboard**: Overview of team points, enrolled participants, and registered programs.
- **Participant Registration**: Register students with unique chest numbers. Automated notification emails sent upon enrollment.
- **Program Entry Submission**: Submit candidate entries within active registration time windows with real-time rule validation.
- **Candidate Replacement Requests**: Submit replacement requests with administrative approval tracking.

### 4. 🌐 Public Audience Portal (`/`)
- **Live Scoreboard**: Real-time overall standings, top team champions, and category-wise points tally.
- **Program Results**: Instant access to detailed winners lists with podium highlights, candidate chest numbers, grades, and points.
- **Participant Search & QR Passports**: Lookup candidate profiles, registered events, and individual scores with downloadable digital badges and QR codes.
- **Audience Polls & Predictions**: Live voting polls with animated outcome charts and event predictions with an audience leaderboard.
- **AI Chatbot**: Festival assistant powered by Google Gemini AI capable of answering fest inquiries in English and Malayalam.

---

## 📧 Automated Resend Email Engine

Integrated with **Resend Transactional Email API** using the verified custom domain `maerika2k26.jawharathululoomsuffadars.online`:
- 🔐 **Team Welcome & Portal Credentials**: Automated credentials delivery to new team leaders.
- ✅ **Student Registration Confirmations**: Live receipts when participants are added to squads.
- 📋 **Program Entry Receipts**: Official confirmation of competition entries.
- 🏆 **Result Announcement Notifications**: Branded placement notifications with squad highlights sent immediately upon result approval.
- 📱 **Responsive Design**: All email templates feature adaptive responsive layouts optimized for mobile inboxes (Gmail, Outlook, Apple Mail) and desktop.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Components & Server Actions) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | Vanilla CSS Design Tokens + [Tailwind CSS](https://tailwindcss.com/) + Glassmorphism |
| **Database** | [Google Cloud Firestore](https://firebase.google.com/docs/firestore) (Firebase Admin SDK & Web Client) |
| **Authentication** | [Firebase Auth](https://firebase.google.com/docs/auth) & JWT Session Tokens |
| **Email Delivery** | [Resend](https://resend.com/) with Verified Custom Domain |
| **Artificial Intelligence** | [Google Gemini](https://ai.google.dev/) (`@google/generative-ai`) |
| **Offline & Mobile** | Progressive Web App (PWA) with Service Worker Caching & Offline Fallback |
| **Icons & UI** | [Lucide React](https://lucide.dev/) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.17 or higher)
- npm or pnpm or yarn
- Firebase Project with Firestore enabled
- Resend Account with a verified domain (or API key)

### Local Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/muhammedjibinziyadt/Dars-Fest.git
   cd dars-fest
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the project root:
   ```env
   # Base Application URLs
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_BASE_URL=http://localhost:3000

   # Authentication & Security
   JWT_SECRET=your_jwt_secret_key_here

   # Google Gemini AI Key
   GEMINI_API_KEY=your_gemini_api_key_here

   # Firebase Public Web Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Firebase Admin Service Account (Server-side)
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

   # Resend Transactional Email
   RESEND_API_KEY=re_your_resend_api_key
   RESEND_FROM_EMAIL=
   RESEND_REPLY_TO=
   ```

4. **Run the local development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   - Public Fest Portal: `http://localhost:3000`
   - Admin Command Center: `http://localhost:3000/admin`
   - Jury Deck: `http://localhost:3000/jury/login`
   - Team Leader Portal: `http://localhost:3000/team/login`

---

## 🌐 Deploying to Vercel

1. Push your repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. In **Settings ➔ Environment Variables**, add the environment variables listed in the `.env` section above.
4. Deploy the project. The application will automatically optimize builds and configure serverless functions.

---

## 📜 Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| **Dev** | `npm run dev` | Starts the Next.js local development server with hot-reloading |
| **Build** | `npm run build` | Builds the production bundle with Webpack, PWA, and static route optimization |
| **Start** | `npm start` | Runs the compiled production server |
| **Lint** | `npm run lint` | Checks codebase for linting issues |
| **PWA Icons** | `npm run generate-icons` | Generates all PWA icons across standard sizes |

---

## 🔒 Security & Privacy Practices

- **Zero Client Leakage**: Sensitive environment variables (`FIREBASE_PRIVATE_KEY`, `RESEND_API_KEY`, `JWT_SECRET`) are strictly scoped to server-side executions and never bundled into client assets.
- **Role-Based Access Control**: Route handlers and server actions are guarded with cryptographic session verification.
- **Input Sanitization**: Database inputs and chest numbers are strictly sanitized and deduplicated before committing to Firestore.

---

<div align="center">
  <p><strong>Maerika 2K26 &bull; കലായുഗ ഭാവുകം</strong></p>
  <p>&copy; 2026 Jawharathul Uloom Suffa Dars Fest Committee. All rights reserved.</p>
</div>

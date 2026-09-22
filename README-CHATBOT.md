# AI Chatbot Feature

This feature adds an AI-powered chatbot to the Funoon Fiesta 2.0 application.
It uses Google's Gemini 2.5 (via `gemini-1.5-flash` model) to answer questions about the fest.

## Setup

1.  **Environment Variable**:
    You must add your Gemini API key to `.env.local`:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```
    You can get a key from [Google AI Studio](https://aistudio.google.com/).

2.  **Dependencies**:
    The following packages were installed:
    -   `@google/generative-ai`
    -   `react-markdown`
    -   `remark-gfm`

    If you haven't already, run:
    ```bash
    npm install
    ```

3.  **Restart Server**:
    Since new dependencies were added, please restart your development server:
    ```bash
    npm run dev
    ```

## Features

-   **Dedicated Page**: Accessible at `/chatbot` (and via the sidebar).
-   **Context Aware**: Knows about Teams, Programs, Results, and Students.
-   **Multilingual**: Supports Malayalam and English.
-   **Read-Only**: Securely accesses data without modification rights.
-   **Privacy Focused**: Does not expose passwords or sensitive admin data.

## Files Created/Modified

-   `src/app/chatbot/page.tsx`: The frontend chat interface.
-   `src/app/api/chat/route.ts`: The backend API handler.
-   `src/lib/chatbot-service.ts`: Service to fetch and format fest data.
-   `src/components/vertical-nav-sidebar.tsx`: Added link to the chatbot.

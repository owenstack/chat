# Chat - Connect Across Languages 🌍

> **TanStack Start Hackathon Submission**  
> Breaking language barriers with real-time AI translation

**Live Demo:** <https://chat.efobi.dev>

A full-stack chat application that enables seamless global communication through instant AI-powered language translation. Built with TanStack Start and leveraging multiple hackathon partner integrations.

## 🏆 Hackathon Partner Integrations

This project showcases **ALL** major hackathon partner technologies:

### Core Stack

- **[TanStack Start](https://tanstack.com/start)** - Full-stack React framework with SSR, server functions, and file-based routing
- **[Convex](https://convex.dev)** - Real-time serverless backend with instant data sync and authentication

### Partner Integrations

- **[Cloudflare Workers](https://workers.cloudflare.com)** - Edge deployment for global low-latency performance
- **[Sentry](https://sentry.io)** - Application monitoring, error tracking, and user feedback collection
- **[Autumn](https://useautumn.com)** - Integrated billing and subscription management with Convex

### Additional Tech

- **Auth0** - Authentication via Convex's 80+ OAuth integrations
- **React 19** - Latest React with concurrent features
- **Tailwind CSS 4** - Modern styling with v4 features
- **TanStack Query** - Server state management and caching

## 🎯 Key Features

- **Real-time Translation** - Speak in any language, read in yours. AI translates messages instantly
- **Live Presence** - See who's online and typing in real-time using Convex Presence
- **Multi-room Support** - Create public or private chat rooms with automatic language detection
- **Subscription Management** - Integrated billing powered by Autumn + Convex
- **Error Monitoring** - Comprehensive tracking with Sentry's session replay and feedback widgets
- **Edge Performance** - Deployed on Cloudflare Workers for sub-100ms global response times

## 🚀 Quick Start

### Prerequisites

- Bun
- Convex account ([signup free](https://convex.dev))
- Auth0 account
- Sentry account
- Autumn account
- Cloudflare account

### Installation

```bash
# Install dependencies
bun install

# Set up Convex
npx convex dev

# Configure environment variables (see below)

# Start development server
bun run dev
```

### Environment Variables

Create a `.env.local` file:

```bash
# Convex
CONVEX_DEPLOYMENT=your-deployment-url

# Auth0 (via Convex Auth)
VITE_AUTH0_DOMAIN=your-auth0-domain
VITE_AUTH0_CLIENT_ID=your-client-id

# Autumn
AUTUMN_SECRET_KEY=your-autumn-secret

# Sentry
SENTRY_DSN=your-sentry-dsn
```

## 📦 Deployment

Deploy to Cloudflare Workers with one command:

```bash
bun run deploy
```

This builds the app, copies Sentry instrumentation, and deploys to Cloudflare's global edge network.

## 🏗️ Architecture

Built with TanStack Start's file-based routing system and Convex's reactive backend:

- **Frontend**: React 19 + TanStack Start (SSR + Server Functions)
- **Backend**: Convex (serverless, real-time, fully typed)
- **Edge Runtime**: Cloudflare Workers with Node.js compatibility
- **Monitoring**: Sentry session replay + error tracking
- **Billing**: Autumn subscriptions integrated with Convex

### Project Structure

```bash
├── src/
│   ├── routes/          # TanStack Start file-based routes
│   ├── components/      # React components
│   └── lib/             # Utilities and providers
├── convex/
│   ├── chat.ts          # Real-time chat functions
│   ├── presence.ts      # Live user presence
│   ├── autumn.ts        # Billing integration
│   └── auth.config.ts   # Auth0 configuration
└── wrangler.jsonc       # Cloudflare Workers config
```

## 🧪 Testing

```bash
bun run test
```

Uses Vitest with React Testing Library.

## 📊 Performance

- **Edge Deployment**: Cloudflare's global network
- **Real-time Sync**: Convex reactive queries (<50ms updates)
- **SSR**: TanStack Start server-side rendering
- **Error Tracking**: Sentry monitoring with 0.1s session replay

## 🎨 Tech Highlights

**TanStack Start Features Used:**

- File-based routing with nested layouts
- Server functions for API endpoints
- SSR with streaming
- Server/client data coordination

**Convex Features Used:**

- Real-time reactive queries
- Server-side functions (queries, mutations, actions)
- Convex Auth integration
- Convex Presence component
- Action Retrier component

**Cloudflare Features:**

- Workers platform
- Node.js compatibility mode
- Edge observability

**Sentry Features:**

- Error tracking
- Session replay
- User feedback widget
- Performance monitoring

## 📝 License

MIT

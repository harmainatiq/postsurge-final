# AI Social Media Post Generator

An AI-powered platform for generating, managing, and scheduling social media posts with brand guidelines.

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Radix UI
- **Backend:** Express.js, tRPC, Node.js
- **Database:** PostgreSQL with Drizzle ORM
- **Storage:** Cloudinary
- **AI:** OpenAI API (GPT-4o-mini)
- **Auth:** JWT-based email/password authentication
- **Scheduling:** Inngest (serverless cron jobs)

## Features

- AI-powered post generation based on brand guidelines
- Brand voice and style management
- Post scheduling with Zapier integration
- Bulk post generation (30 posts at once)
- Post editing and management dashboard
- Automated scheduling with Inngest (Vercel-compatible)

## Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database
- OpenAI API key
- Cloudinary account

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Authentication
JWT_SECRET=your-secret-key-here

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Server (optional)
PORT=3000
NODE_ENV=development

# Inngest (for scheduled tasks)
# Get your signing key from https://app.inngest.com
# Leave empty for local development
INNGEST_SIGNING_KEY=
INNGEST_EVENT_KEY=
```

### 3. Get API Keys

**PostgreSQL Database:**
- Use a local PostgreSQL instance or a cloud provider (Supabase, Neon, Railway, etc.)
- Connection string format: `postgresql://user:password@host:port/database`

**OpenAI API Key:**
- Sign up at https://platform.openai.com/
- Go to API Keys section
- Create a new secret key

**Cloudinary:**
- Sign up at https://cloudinary.com/
- Go to Dashboard
- Copy Cloud Name, API Key, and API Secret

**JWT Secret:**
- Generate a random string: `openssl rand -base64 32`
- Or use any secure random string

### 4. Database Setup

Run migrations to create tables:

```bash
pnpm db:push
```

### 5. Start Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

### 6. Inngest Setup (Optional for Local Dev)

For scheduled post processing, see [INNGEST_SETUP.md](./INNGEST_SETUP.md) for detailed instructions.

**Quick start for local development:**
```bash
npx inngest-cli@latest dev
```

This will start the Inngest dev server at `http://localhost:8288` where you can test and monitor scheduled functions.

## Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm check` - Type check
- `pnpm format` - Format code with Prettier
- `pnpm test` - Run tests
- `pnpm db:push` - Generate and run database migrations

## Project Structure

```
├── client/              # Frontend React app
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # Utilities
│   └── public/          # Static assets
├── server/              # Backend Express app
│   ├── _core/           # Core server utilities
│   │   ├── auth.ts      # Authentication
│   │   ├── llm.ts       # OpenAI integration
│   │   └── index.ts     # Server entry
│   ├── api/             # API routes
│   │   └── inngest.ts   # Inngest endpoint
│   ├── inngest/         # Scheduled functions
│   │   ├── client.ts    # Inngest client
│   │   └── functions.ts # Cron functions
│   ├── db.ts            # Database operations
│   ├── routers.ts       # tRPC routers
│   └── storage.ts       # Cloudinary integration
├── drizzle/             # Database schema and migrations
└── shared/              # Shared types and constants
```

## Authentication

The app uses JWT-based email/password authentication:

- **Register:** `POST /api/auth/register` - Create new account
- **Login:** `POST /api/auth/login` - Sign in
- **Logout:** `POST /api/auth/logout` - Sign out
- **Current User:** `GET /api/auth/me` - Get authenticated user

## API Endpoints

All API routes are handled through tRPC at `/api/trpc/*`

## Deployment

### Vercel (Recommended)

Your app is configured as a monorepo that deploys as a single unit - no need to deploy frontend and backend separately!

1. **Push your code to GitHub**

2. **Import project in Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Vercel will auto-detect the Node.js project

3. **Configure Environment Variables** in Vercel Dashboard:
   ```
   DATABASE_URL=your-postgres-connection-string
   JWT_SECRET=your-secret-key
   GEMINI_API_KEY=your-gemini-key (or OPENAI_API_KEY)
   LLM_PROVIDER=gemini (or openai)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   INNGEST_SIGNING_KEY=your-inngest-key (optional)
   INNGEST_EVENT_KEY=your-inngest-event-key (optional)
   NODE_ENV=production
   ```

4. **Deploy**
   - Vercel will run `pnpm build` automatically
   - Your app will be live at `yourapp.vercel.app`
   - Both frontend and backend run on the same domain (no CORS issues!)

5. **Setup Inngest** (for scheduled posts)
   - Follow [INNGEST_SETUP.md](./INNGEST_SETUP.md) to register your app with Inngest
   - Add `INNGEST_SIGNING_KEY` and `INNGEST_EVENT_KEY` to Vercel environment variables

### How It Works

- **Single deployment**: Express server serves both API and frontend
- **Build output**: 
  - `dist/app.js` - Express server bundle
  - `dist/public/` - React app static files
- **Routing**: All requests go through Express, which serves static files or API responses
- **Cookies**: Work seamlessly (same domain, no CORS)

### Other Platforms

For Railway, Render, or other platforms:

1. Set environment variables in your hosting platform
2. Build the app: `pnpm build`
3. Start the server: `pnpm start`

For Inngest setup on production, see [INNGEST_SETUP.md](./INNGEST_SETUP.md).

## License

MIT.

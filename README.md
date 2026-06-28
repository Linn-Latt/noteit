# NoteIt

A minimal, distraction-free note-taking web app. Write and organize notes into notebooks, and let AI summarize content for you. 

---

## Tech Stack

### Framework & Runtime
| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.6 (App Router) |
| UI Library | React 19 |
| Language | TypeScript 5 |

### Database & ORM
| Layer | Technology |
|---|---|
| Database | PostgreSQL via [Neon](https://neon.tech) (serverless) |
| ORM | Prisma 7 with `@prisma/adapter-neon` |
| Client output | `app/generated/prisma` |
| Singleton | `lib/prisma.ts` — `globalThis` pattern to prevent hot-reload connection leaks |

### Authentication
- **better-auth** with Prisma adapter
- Email/password strategy
- Server session: `auth.api.getSession({ headers: await headers() })` from `lib/auth.ts`
- Client session: `authClient` from `lib/auth-client.ts`
- Three-stage email validation on sign-up:
  1. Regex format check
  2. Disposable domain blocklist 
  3. Live deliverability check via [ZeroBounce API](https://www.zerobounce.net/) — rejects `invalid`, `spamtrap`, `do_not_mail`

### AI
- Vercel AI SDK (`ai`) + `@ai-sdk/groq`
- Model: `llama-3.1-8b-instant` (Groq)
- Streaming summarization of note content or any public URL (via [Jina Reader](https://jina.ai/reader/))

---

## Environment Variables

Create a `.env` file at the project root:

```env
# Database (Neon serverless PostgreSQL)
DATABASE_URL=

# Auth base URL (e.g. http://localhost:3000 in dev)
BETTER_AUTH_URL=

# Email deliverability validation
ZEROBOUNCE_API_KEY=

# AI summarization (Groq)
GROQ_API_KEY=
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Push schema to the database and generate Prisma client
npx prisma migrate dev

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
noteit/
├── app/
│   ├── (auth)/                        # Auth route group (no shared layout)
│   │   ├── login/
│   │   │   └── page.tsx               # Sign-in page
│   │   └── register/
│   │       └── page.tsx               # Sign-up page
│   │
│   ├── api/                           # Next.js Route Handlers
│   │   ├── auth/
│   │   │   └── [...all]/route.ts      # better-auth catch-all handler
│   │   ├── notes/
│   │   │   ├── route.ts               # GET (quick notes), POST
│   │   │   └── [id]/
│   │   │       ├── route.ts           # GET, PATCH, DELETE a note
│   │   │       └── move/route.ts      # PATCH — move note between notebooks
│   │   ├── notebooks/
│   │   │   ├── route.ts               # GET all notebooks (with notes), POST
│   │   │   └── [id]/route.ts          # PATCH, DELETE a notebook
│   │   ├── summarize/
│   │   │   └── route.ts               # POST — AI summarize (note content or URL)
│   │   ├── trash/
│   │   │   ├── route.ts               # GET soft-deleted notes
│   │   │   └── restore/route.ts       # POST — restore a note from trash
│   │   └── cron/
│   │       └── cleanup/route.ts       # Cron job — hard-delete old trashed notes
│   │
│   ├── note/                          # Main protected app route
│   │   ├── components/
│   │   │   ├── note-layout.tsx        # Root layout for the note view
│   │   │   ├── sidebar.tsx            # Notebook + note tree navigation
│   │   │   ├── note-editor.tsx        # Editor wrapper (Lexical integration)
│   │   │   └── bin.tsx                # Trash / bin view
│   │   └── page.tsx                   # /note entry point
│   │
│   ├── generated/
│   │   └── prisma/                    # Auto-generated Prisma client — do not edit
│   │
│   ├── globals.css                    # Global styles + CSS variable tokens
│   ├── layout.tsx                     # Root layout (fonts, dark mode script)
│   └── page.tsx                       # Landing page
│
├── components/
│   ├── blocks/
│   │   └── editor-00/                 # Lexical editor block (editor, nodes, plugins)
│   └── editor/
│       ├── context/                   # Toolbar context provider
│       ├── editor-hooks/              # useModal, useUpdateToolbar
│       ├── editor-ui/                 # ColorPicker, ContentEditable
│       └── plugins/
│           └── toolbar/               # Toolbar plugin + block format controls
│
├── lib/
│   ├── auth.ts                        # better-auth server instance + email validation hooks
│   ├── auth-client.ts                 # better-auth browser client
│   └── prisma.ts                      # Prisma singleton (globalThis pattern)
│
├── prisma/
│   ├── schema.prisma                  # DB schema
│   └── migrations/                    # Auto-generated migration history
│
├── .env                               # Local environment variables (not committed)
├── .gitignore
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

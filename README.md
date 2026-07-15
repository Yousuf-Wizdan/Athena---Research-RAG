<div align="center">

# ⚡ ATHENA RAG
### *Production-Grade RAG Research Intelligence Platform*

<br/>

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-athena--rag--theta.vercel.app-6366f1?style=for-the-badge&logoColor=white)](https://athena-rag-theta.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Yousuf--Wizdan-24292e?style=for-the-badge&logo=github)](https://github.com/Yousuf-Wizdan/Athena---Research-RAG)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com)

<br/>

> **Upload. Ask. Discover. Synthesize.**
> *Athena transforms your research papers into a conversational knowledge base — powered by production-grade RAG, vector search, and LLM orchestration.*

<br/>

```
┌──────────────────────────────────────────────────────────┐
│  📄 Upload PDF  →  🧠 Embed  →  🔍 Semantic Search       │
│  💬 AI Chat  →  🔗 Cross-Paper Synthesis  →  ✨ Insight   │
└──────────────────────────────────────────────────────────┘
```

</div>

---

## 🎯 What Makes This Different

Most RAG demos are toy projects — a Python script, a CSV, a chatbot. **Athena is a production system** with auth, multi-tenancy, cloud vector databases, and a polished UI deployed at scale.

| Dimension | What was built |
|---|---|
| **Retrieval** | Cosine-similarity vector search over chunked PDF text via Qdrant Cloud |
| **Generation** | Streaming LLM responses with real source attribution |
| **Infrastructure** | Serverless Edge functions (Vercel) + managed vector DB + managed PostgreSQL |
| **Security** | JWT session cookies, bcrypt password hashing, per-user data isolation |
| **Robustness** | Idempotent Qdrant index management, graceful error handling, TypeScript end-to-end |

---

## ✨ Core Features

### 🧠 Intelligent Paper Ingestion
- Upload any research PDF — Athena extracts full text, runs an **LLM metadata pass** to infer title, authors, year, and abstract
- Documents are split into **overlapping chunks** (1,000 tokens / 200 overlap) via LangChain's `RecursiveCharacterTextSplitter`
- Each chunk is embedded using **Mistral `mistral-embed`** or **OpenAI `text-embedding-3-large`** (1,024 dimensions) and stored in Qdrant Cloud

### 🔍 Dual-Mode Search
- **Semantic search** — cosine-similarity vector retrieval with per-user tenant filtering
- **Lexical search** — Postgres full-text search across title, authors, and abstract
- Results hydrated with similarity scores and text snippets for explainability

### 💬 Persistent AI Chat
- Conversation threads stored in PostgreSQL — your research sessions survive page refreshes
- Every response streams in real-time using the **Vercel AI SDK** streaming protocol
- Sources are cited inline with paper titles and relevant passages

### 🔗 Cross-Paper Synthesis
- Athena retrieves top chunks from **multiple papers simultaneously** and synthesises a unified answer
- Useful for literature reviews, gap analysis, and comparing methodologies across studies

### 🔐 Auth & Multi-Tenancy
- JWT session cookies (HttpOnly, Secure) with server-side validation on every request
- Every paper, thread, and message is scoped to the authenticated user — zero cross-contamination in Qdrant vector queries

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (React 19)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ PaperUpload │  │  ChatThread  │  │  SynthesisPortal      │  │
│  └──────┬──────┘  └──────┬───────┘  └───────────┬───────────┘  │
└─────────┼────────────────┼──────────────────────┼──────────────┘
          │                │                       │
          ▼                ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Next.js 16 App Router (Vercel Edge)            │
│                                                                  │
│  /api/papers/upload    /api/papers/search    /api/papers/chat    │
│  /api/papers/synthesis /api/threads          /api/auth/*         │
└────────┬───────────────────────┬────────────────────────────────┘
         │                       │
         ▼                       ▼
┌────────────────┐    ┌──────────────────────────┐
│  Neon Postgres │    │     Qdrant Cloud          │
│  (via Prisma)  │    │  1024-dim Cosine vectors  │
│                │    │  + keyword payload index  │
│  Users         │    │                           │
│  Sessions      │    │  metadata.userId filter   │
│  Papers        │    │  metadata.paperId filter  │
│  Threads       │    │                           │
│  Messages      │    └──────────────────────────┘
└────────────────┘
         │
         ▼
┌────────────────────────┐
│   LangChain + AI SDK   │
│  Mistral / OpenAI APIs │
│  Embeddings + LLM      │
└────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Next.js 16 (App Router + Turbopack) | Full-stack React with serverless API routes, streaming, and edge deployment |
| **Language** | TypeScript 5 | End-to-end type safety from DB schema to UI props |
| **UI** | React 19 + Tailwind CSS v4 + shadcn/ui | Accessible, composable component library with zero-runtime CSS |
| **ORM** | Prisma 6 + Neon PostgreSQL | Type-safe DB queries, auto-generated client, serverless-optimised connection pooling |
| **Vector DB** | Qdrant Cloud | Production vector search with payload filtering, keyword indexing, and a generous free tier |
| **Embeddings** | Mistral `mistral-embed` / OpenAI `text-embedding-3-large` | 1,024-dim dense embeddings with provider abstraction for flexibility |
| **LLM** | Mistral / OpenAI (via AI SDK + LangChain) | Streaming responses with tool-calling and structured output support |
| **Auth** | JWT + bcrypt (custom, no NextAuth) | Full control over session lifecycle without third-party vendor lock-in |
| **PDF Parsing** | pdf-parse | Zero-dependency PDF text extraction, runs entirely server-side |
| **Deployment** | Vercel (Production + Preview) | Git-integrated serverless deploys with global CDN and edge network |

---

## 🔬 Technical Deep-Dives

<details>
<summary><b>📐 Chunking Strategy</b></summary>

Papers are split using LangChain's `RecursiveCharacterTextSplitter` with:
- **Chunk size**: 1,000 tokens — enough context for coherent reasoning
- **Overlap**: 200 tokens — prevents cutting mid-sentence at boundaries
- **Metadata preserved**: `paperId`, `userId`, `title`, `source`, `chunkIndex`

This metadata is stored as Qdrant payload, enabling per-user multi-tenant filtering without leaking documents across accounts.

</details>

<details>
<summary><b>🏷️ Multi-Tenant Vector Isolation</b></summary>

Unlike naive RAG implementations that expose all documents to all users, Athena enforces isolation at the vector query level:

```typescript
// Every search filters by the authenticated user's ID
const mustFilters = [
  { key: "metadata.userId", match: { value: user.id } }
];
const results = await vectorStore.similaritySearchWithScore(query, 15, { must: mustFilters });
```

Qdrant Cloud requires **payload keyword indexes** to execute filter queries. Athena ensures these are created idempotently via direct REST API calls (HTTP 409 = already exists = treated as success):

```typescript
// PUT /collections/research_papers/index
// { field_name: "metadata.userId", field_schema: "keyword" }
```

</details>

<details>
<summary><b>🔄 LLM Metadata Extraction Pipeline</b></summary>

When a PDF is uploaded, Athena sends the first 3,000 characters to an LLM with a structured JSON prompt to extract:

```json
{
  "title": "Attention Is All You Need",
  "authors": "Ashish Vaswani, Noam Shazeer, ...",
  "publishedYear": 2017,
  "abstract": "We propose a new simple network architecture..."
}
```

Fallback logic handles malformed JSON gracefully — production reliability over brittle perfection.

</details>

<details>
<summary><b>⚡ Streaming Architecture</b></summary>

Chat responses stream token-by-token using the **Vercel AI SDK** streaming protocol:
- Server emits a `ReadableStream` of text chunks
- Client reads with `useChat()` hook — no polling, no full-response buffering
- Sources (paper titles + snippets) are attached to each message and persisted to Postgres

</details>

<details>
<summary><b>🔑 Why fetch over the Qdrant JS client for index creation</b></summary>

The Qdrant JS client throws on HTTP 409 (index already exists). When this is wrapped in a `try/catch` warning block, the error is swallowed silently — indexes never get created, and every filter query fails with a 400 Bad Request in production.

The fix: use native `fetch` and treat 409 explicitly as success:

```typescript
if (!res.ok && res.status !== 409) {
  throw new Error(`Index creation failed: ${res.status}`);
}
// 200 OR 409 → index is ready, proceed
```

This makes index creation truly idempotent and surfaces real failures instead of hiding them.

</details>

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+, pnpm 9+
- A [Qdrant Cloud](https://cloud.qdrant.io) cluster (free tier works)
- A [Neon](https://neon.tech) PostgreSQL database (free tier works)
- A Mistral AI or OpenAI API key

### 1. Clone & Install

```bash
git clone https://github.com/Yousuf-Wizdan/Athena---Research-RAG.git
cd Athena---Research-RAG
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Database
DATABASE_URL="postgresql://..."

# Vector DB
QDRANT_URL="https://xxx.cloud.qdrant.io:6333"
QDRANT_API_KEY="your_qdrant_api_key"

# AI Provider (pick one)
AI_PROVIDER="mistral"
MISTRAL_API_KEY="your_mistral_key"
# OPENAI_API_KEY="your_openai_key"

# Auth
JWT_SECRET="your_super_secret_jwt_key_min_32_chars"
```

### 3. Initialise the Database

```bash
npx prisma migrate deploy
```

### 4. Run Locally

```bash
pnpm dev
# → http://localhost:3000
```

---

## 📦 Deployment

### Deploy to Vercel

```bash
npx vercel --prod
```

Set all environment variables in the Vercel dashboard under **Settings → Environment Variables** for both **Production** and **Preview**.

### Local Qdrant via Docker

```bash
docker-compose up -d
# Local Qdrant at http://localhost:6333
```

---

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/          # Login, logout, register, session
│   │   ├── papers/
│   │   │   ├── chat/      # Streaming RAG chat endpoint
│   │   │   ├── search/    # Semantic + lexical search + DELETE
│   │   │   ├── synthesis/ # Cross-paper synthesis
│   │   │   └── upload/    # PDF ingestion pipeline
│   │   └── threads/       # Conversation thread management
│   ├── login/             # Auth page
│   └── page.tsx           # Main application shell
│
├── components/
│   ├── chat.tsx                 # Streaming chat UI with thread sidebar
│   ├── paper-search-portal.tsx  # Dual-mode search + library view
│   ├── paper-uploader.tsx       # Drag-and-drop PDF upload
│   ├── synthesis-portal.tsx     # Cross-paper synthesis UI
│   └── ui/                      # shadcn/ui primitives
│
├── lib/
│   ├── auth.ts            # JWT session management
│   ├── env-config.ts      # Provider abstraction (Mistral/OpenAI)
│   ├── prisma.ts          # Singleton Prisma client
│   └── qdrant.ts          # Vector store + idempotent index management
│
└── prisma/
    └── schema.prisma      # User, Session, Paper, Thread, Message models
```

---

## 📊 Performance Characteristics

| Operation | Latency (P50) |
|---|---|
| PDF ingestion (10-page paper) | ~4–8 seconds |
| Semantic search (top-15 chunks) | ~200–400ms |
| First chat token (streaming) | ~600–1,200ms |
| Cross-paper synthesis | ~2–5 seconds |

---

## 🗺️ Roadmap

- [ ] **Hybrid search** — combine BM25 lexical + vector scores via Reciprocal Rank Fusion
- [ ] **Citation graph** — extract and visualise paper reference networks
- [ ] **Multi-modal** — support figures and tables via vision models
- [ ] **Export** — download synthesis results as structured markdown / LaTeX
- [ ] **Collaboration** — shared paper libraries and annotation layers

---

## 👨‍💻 Author

**Yousuf Wizdan** — Full-Stack Engineer · AI/ML Systems

[![GitHub](https://img.shields.io/badge/GitHub-Yousuf--Wizdan-24292e?style=flat-square&logo=github)](https://github.com/Yousuf-Wizdan)

---

<div align="center">

*Built from first principles. Deployed to production. Ready for scale.*

**[⚡ Try Athena Live →](https://athena-rag-theta.vercel.app)**

</div>


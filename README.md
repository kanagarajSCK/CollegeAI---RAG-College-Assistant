# CollegeAI — Production RAG-Based College Chatbot

CollegeAI is a production-grade AI-powered college information assistant built with a **Retrieval-Augmented Generation (RAG)** pipeline. Users can register, upload college documents (PDFs, DOCXs, TXT notices, academic calendars, hostel handbooks, exam regulations, and placement circulars), and ask complex campus-related questions. The system extracts relevant passages from the indexed documents and generates grounded answers with verifiable source citations and page numbers.

---

## 🌟 Key Features

1. **Grounded RAG Pipeline**:
   - Semantic text extraction for PDF, DOCX, and TXT documents.
   - Text chunking (500–1000 characters) with overlap preservation.
   - 768-dimensional vector embeddings with cosine similarity retrieval.
   - Zero hallucination policy: If an answer cannot be verified in the uploaded documents, the AI explicitly states it cannot find the information.
2. **Document Citations & Source Inspection**:
   - Every answer includes citations linking directly to the source document, page number, and chunk index.
   - Interactive Source Modal to preview verbatim passages and relevance scores.
3. **Multi-Document & Scoped Queries**:
   - Search across all uploaded knowledge base files or filter to specific documents.
4. **Authentication & Multi-Tenant Isolation**:
   - User registration and login with bcrypt password hashing and JWT sessions.
   - Strict data isolation: documents and chunks are scoped strictly to the authenticated user.
5. **Interactive UI / UX**:
   - Full conversation history with chronological grouping (Today, Yesterday, Previous Days).
   - Markdown rendering with tables, code formatting, bullet points, and copy actions.
   - Document chunk inspector and 1-click sample document loader.

---

## 🏗️ Architecture & Tech Stack

```text
collegeai/
│
├── frontend/ (src/)
│   ├── components/         # Sidebar, ChatMessage, SourceModal, ChunkInspector
│   ├── pages/              # Login, Register, Dashboard, Chat, Documents, Settings
│   ├── context/            # AuthContext & Session management
│   └── services/           # REST API client
│
├── backend/
│   ├── src/controllers/    # Auth, Document, and Chat controllers
│   ├── src/models/         # Database persistence store and domain types
│   ├── src/middleware/     # JWT authentication & Multer upload middleware
│   ├── src/services/       # Document extraction, Vector search, Gemini LLM & RAG
│   └── src/data/           # Sample college document library
│
├── server.ts               # Express server with Vite dev middleware
├── package.json
└── README.md
```

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, React Markdown with GFM.
- **Backend**: Express.js, TypeScript (`tsx`), Multer, PDF-Parse, Mammoth.
- **AI & RAG Engine**: Google GenAI SDK (`@google/genai`), `gemini-3.7-flash`, Vector Similarity Engine.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ installed.
- (Optional) `GEMINI_API_KEY` for live AI generation. (A high-speed deterministic vectorizer and structured response engine is included as an automatic fallback).

### 2. Environment Configuration
Create a `.env` file from `.env.example`:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_jwt_secret_key_here
```

### 3. Run in Development Mode
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🧪 Demo Credentials

For quick evaluation, use the built-in demo credentials:
- **Email**: `alex.student@college.edu`
- **Password**: `college123`

---

## 📄 License
MIT License

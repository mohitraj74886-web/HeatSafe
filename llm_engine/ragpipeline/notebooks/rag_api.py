"""
HeatSafe Navigator — RAG API
FastAPI serving the hybrid RAG chain.

Run:
    uvicorn app:app --reload --port 8002

Endpoints:
    GET  /health         → API status
    POST /ask            → Ask a heat safety question
    POST /ask/batch      → Ask multiple questions (max 10)
    GET  /docs           → Swagger UI
"""

import os, json, time, hashlib, re
from pathlib import Path
from datetime import datetime
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager
from collections import defaultdict

import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from langchain_core.documents import Document
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from rank_bm25 import BM25Okapi

load_dotenv()

BASE_DIR   = Path(__file__).parent.parent
DOCS_DIR   = BASE_DIR / "documents"
VS_DIR     = BASE_DIR / "vector_store"
GROQ_KEY   = os.getenv("GROQ_API_KEY", "")

PDF_FILES  = [
    "climate_change(WHO).pdf",
    "heat_safety(osha).pdf",
    "niosh(controlling_illness_outd....pdf",
    "niosh(heat & hot).pdf",
]

SOURCE_MAP  = {
    "climate_change(WHO).pdf"                : "WHO Climate & Health",
    "heat_safety(osha).pdf"                   : "OSHA Heat Safety Manual",
    "niosh(controlling_illness_outd....pdf"   : "NIOSH Controlling Heat Illness",
    "niosh(heat & hot).pdf"                   : "NIOSH 2016-106 Heat Standard",
}

PRIORITY_MAP = {
    "niosh(heat & hot).pdf"                 : 5,
    "niosh(controlling_illness_outd....pdf" : 4,
    "heat_safety(osha).pdf"                 : 3,
    "climate_change(WHO).pdf"               : 2,
}

SYSTEM_PROMPT = """You are HeatSafe, an AI assistant for outdoor worker heat safety in India.
You answer questions using ONLY the provided document context.
If the context doesn't contain the answer, say you cannot find it in the available guidelines.
Always cite the source document. Quote exact numbers (temperatures, ml, minutes) from context.
For emergencies mention 112.

CONTEXT FROM DOCUMENTS:
─────────────────────────────────────────────────────────
{context}
─────────────────────────────────────────────────────────"""

HUMAN_PROMPT = """Question: {question}

Answer based only on the document context above."""

# ─── App State ────────────────────────────────────────────────────────
STATE = {}

def tokenize(text):
    return [t for t in re.findall(r"[a-zA-Z0-9°]+", text.lower()) if len(t) > 1]

def clean_text(text):
    text = re.sub(r"(\w+)-\n(\w+)", r"\1\2", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r" {2,}", " ", text)
    text = re.sub(r"(?<![.!?\n])\n(?![\n\-•*\d])", " ", text)
    return text.strip()

@asynccontextmanager
async def lifespan(app):
    print("Loading RAG pipeline...")
    # Load documents
    pages = []
    for fn in PDF_FILES:
        fp = DOCS_DIR / fn
        if not fp.exists():
            print(f"  SKIP: {fn} not found")
            continue
        loaded = PyPDFLoader(str(fp)).load()
        for p in loaded:
            p.page_content = clean_text(p.page_content)
            p.metadata["source_tag"] = SOURCE_MAP.get(fn, fn)
            p.metadata["priority"]   = PRIORITY_MAP.get(fn, 1)
            p.metadata["chunk_id"]   = hashlib.md5((p.page_content[:40]).encode()).hexdigest()[:12]
        pages.extend([p for p in loaded if len(p.page_content) > 80])
    print(f"  Loaded {len(pages)} pages")

    # Chunk
    splitter = RecursiveCharacterTextSplitter(chunk_size=900, chunk_overlap=180, add_start_index=True)
    chunks = splitter.split_documents(pages)
    for i, c in enumerate(chunks):
        c.metadata["chunk_id"] = hashlib.md5((c.page_content[:40]).encode()).hexdigest()[:12]
    print(f"  {len(chunks)} chunks")

    # Embeddings + vector store
    embed = HuggingFaceEmbeddings(
        model_name="BAAI/bge-small-en-v1.5",
        encode_kwargs={"normalize_embeddings": True}
    )
    VS_DIR.mkdir(parents=True, exist_ok=True)
    vs_exists = (VS_DIR / "chroma.sqlite3").exists()
    if vs_exists:
        vs = Chroma(embedding_function=embed, collection_name="heatsafe_rag_v1",
                    persist_directory=str(VS_DIR))
    else:
        vs = Chroma.from_documents(chunks, embed, collection_name="heatsafe_rag_v1",
                                    persist_directory=str(VS_DIR))
    print(f"  Vector store: {vs._collection.count()} vectors")

    # BM25
    corpus = [tokenize(c.page_content) for c in chunks]
    bm25   = BM25Okapi(corpus, k1=1.5, b=0.75)

    # LLM
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.0, max_tokens=1024, api_key=GROQ_KEY)

    # Prompt
    prompt = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(SYSTEM_PROMPT),
        HumanMessagePromptTemplate.from_template(HUMAN_PROMPT),
    ])

    STATE.update({"vs": vs, "bm25": bm25, "chunks": chunks,
                  "llm": llm, "prompt": prompt})
    print("✅ RAG pipeline ready")
    yield
    STATE.clear()


app = FastAPI(title="HeatSafe RAG API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# ─── Schemas ──────────────────────────────────────────────────────────
class AskRequest(BaseModel):
    question:   str  = Field(..., example="How much water should a road worker drink per hour?")
    language:   str  = Field("en", description="Response language hint (en/hi/ta/bn)")
    debug:      bool = Field(False)

class SourceRef(BaseModel):
    source_tag: str
    page:       Any
    preview:    str

class AskResponse(BaseModel):
    answer:           str
    sources:          List[SourceRef]
    retrieval_ms:     float
    generation_ms:    float
    total_ms:         float
    chunks_retrieved: int
    model:            str

class BatchAskRequest(BaseModel):
    questions: List[str]


# ─── Retrieval helpers ────────────────────────────────────────────────
def rrf_fuse(dense, sparse, k=60, final=5):
    scores  = defaultdict(float)
    doc_map = {}
    for rank, (doc, _) in enumerate(dense):
        cid = doc.metadata.get("chunk_id", doc.page_content[:20])
        scores[cid] += 1 / (k + rank + 1)
        doc_map[cid] = doc
    for rank, (doc, _) in enumerate(sparse):
        cid = doc.metadata.get("chunk_id", doc.page_content[:20])
        scores[cid] += 1 / (k + rank + 1)
        doc_map[cid] = doc
    top = sorted(scores.items(), key=lambda x: -x[1])[:final]
    return [doc_map[cid] for cid, _ in top]


def retrieve(query: str) -> List[Document]:
    vs, bm25, chunks = STATE["vs"], STATE["bm25"], STATE["chunks"]
    dense   = [(d, s) for d, s in vs.similarity_search_with_score(query, k=8)]
    bm25_s  = bm25.get_scores(tokenize(query))
    top_idx = np.argsort(bm25_s)[::-1][:8]
    sparse  = [(chunks[i], float(bm25_s[i])) for i in top_idx if bm25_s[i] > 0]
    return rrf_fuse(dense, sparse)


def generate(question: str) -> dict:
    t0 = time.time()
    top_chunks   = retrieve(question)
    retrieval_ms = (time.time() - t0) * 1000

    sorted_chunks = sorted(top_chunks, key=lambda c: c.metadata.get("priority", 1), reverse=True)
    context = "\n\n".join(
        f"[Source: {c.metadata.get('source_tag','Unknown')} p.{c.metadata.get('page','?')!s}]\n{c.page_content}"
        for c in sorted_chunks
    )

    messages = STATE["prompt"].format_messages(context=context, question=question)
    t_gen    = time.time()
    response = STATE["llm"].invoke(messages)
    generation_ms = (time.time() - t_gen) * 1000

    sources = [
        SourceRef(source_tag=c.metadata.get("source_tag", "?"),
                  page=c.metadata.get("page", "?"),
                  preview=c.page_content[:100] + "...")
        for c in top_chunks
    ]

    return {
        "answer": response.content.strip(),
        "sources": sources,
        "retrieval_ms": round(retrieval_ms, 1),
        "generation_ms": round(generation_ms, 1),
        "total_ms": round((retrieval_ms + generation_ms), 1),
        "chunks_retrieved": len(top_chunks),
        "model": "llama-3.3-70b-versatile",
    }


# ─── Endpoints ────────────────────────────────────────────────────────
@app.get("/health")
def health():
    vs = STATE.get("vs")
    return {"status": "ok", "vectors_stored": vs._collection.count() if vs else 0,
            "model": "llama-3.3-70b-versatile"}


@app.post("/ask", response_model=AskResponse)
def ask(req: AskRequest):
    if not STATE.get("vs"):
        raise HTTPException(503, "RAG pipeline not ready")
    if not req.question.strip():
        raise HTTPException(400, "Question cannot be empty")
    try:
        result = generate(req.question)
        return AskResponse(**result)
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/ask/batch")
def ask_batch(req: BatchAskRequest):
    if len(req.questions) > 10:
        raise HTTPException(400, "Max 10 questions per batch")
    return [generate(q) for q in req.questions]
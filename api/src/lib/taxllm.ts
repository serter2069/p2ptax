/**
 * Thin client for the TaxLLM RAG service.
 * Frontend never talks to TaxLLM directly — it goes through /api/consultant/*
 * so we attach the user, log every Q+A and can gate by quota later.
 */

const TAXLLM_URL = process.env.TAXLLM_URL || "https://taxllm.smartlaunchhub.com";

export interface TaxLLMSource {
  source: string;
  label: string;
  short: string;
  article_number: string | null;
  article_title: string | null;
  part: string | null;
  glava: string | null;
  punkt: string | null;
  chunk: number;
  score: number;
  snippet: string;
}

export interface TaxLLMUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  cost?: number;
}

export interface TaxLLMDebug {
  search_query?: string;
  primary_top_score?: number;
  tree_fallback?: boolean;
  cited_articles?: string[];
  context_chunks?: Array<{ source: string; label: string; chunk: number; score: number; punkt: string | null }>;
}

export interface TaxLLMResponse {
  answer: string;
  sources: TaxLLMSource[];
  usage: TaxLLMUsage;
  debug?: TaxLLMDebug;
}

export async function askTaxLLM(message: string, conversationId?: string): Promise<TaxLLMResponse> {
  const r = await fetch(`${TAXLLM_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, conversation_id: conversationId }),
    signal: AbortSignal.timeout(180_000),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`TaxLLM ${r.status}: ${text.slice(0, 300)}`);
  }
  return (await r.json()) as TaxLLMResponse;
}

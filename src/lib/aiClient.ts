/**
 * Trusted Backend API Client for Gemini AI Operations.
 * The Gemini API key is never exposed to the client.
 */

export interface AiChatHistoryItem {
  role: 'user' | 'gemini';
  content: string;
}

export async function requestAiReflection(data: {
  title: string;
  content: string;
  mood?: string;
}): Promise<string> {
  const res = await fetch('/api/ai/reflect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to generate reflection.');
  }
  return json.reflection;
}

export async function requestAiSummary(data: {
  title: string;
  content: string;
}): Promise<string> {
  const res = await fetch('/api/ai/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to generate summary.');
  }
  return json.summary;
}

export async function requestAiBrainstorm(data: {
  content: string;
  query?: string;
}): Promise<string> {
  const res = await fetch('/api/ai/brainstorm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to brainstorm ideas.');
  }
  return json.ideas;
}

export async function requestAiOrganize(data: {
  content: string;
}): Promise<string> {
  const res = await fetch('/api/ai/organize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to organize thoughts.');
  }
  return json.organized;
}

export async function requestAiContinuation(data: {
  content: string;
}): Promise<string> {
  const res = await fetch('/api/ai/continue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to continue writing.');
  }
  return json.continuation;
}

export async function requestAiChat(data: {
  message: string;
  journalContent: string;
  journalTitle: string;
  history: AiChatHistoryItem[];
}): Promise<string> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to receive chat reply.');
  }
  return json.reply;
}

export async function requestAiActionItems(data: {
  content: string;
}): Promise<string> {
  const res = await fetch('/api/ai/action-items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to extract action items.');
  }
  return json.actionItems;
}

export async function requestAiQuestions(data: {
  content: string;
}): Promise<string> {
  const res = await fetch('/api/ai/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to generate questions.');
  }
  return json.questions;
}

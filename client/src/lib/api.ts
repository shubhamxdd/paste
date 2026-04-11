export interface Paste {
  id: string;
  title: string | null;
  content?: string;
  language: string;
  created_at: string;
  protected: boolean;
}

export interface CreatePasteInput {
  title?: string;
  content: string;
  language: string;
  paraphrase?: string;
  customId?: string;
}

const BASE = '/api/pastes';

export async function createPaste(data: CreatePasteInput): Promise<{ id: string }> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create paste');
  }
  return res.json();
}

export async function getPaste(id: string): Promise<Paste> {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Paste not found');
  }
  return res.json();
}

export async function unlockPaste(id: string, paraphrase: string): Promise<Paste> {
  const res = await fetch(`${BASE}/${id}/unlock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paraphrase }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Incorrect paraphrase');
  }
  return res.json();
}

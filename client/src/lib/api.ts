export interface Paste {
  id: string;
  title: string | null;
  content?: string;
  language: string;
  created_at: string;
  views: number;
  protected: boolean;
}

export interface CreatePasteInput {
  title?: string;
  content: string;
  language: string;
  paraphrase?: string;
  customId?: string;
}

export interface PasteListItem {
  id: string;
  title: string | null;
  language: string;
  created_at: string;
  protected: boolean;
}

export interface PasteListResponse {
  pastes: PasteListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CollectionListItem {
  id: string;
  title: string;
  paste_count: number;
  created_at: string;
}

export interface CollectionListResponse {
  collections: CollectionListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface Collection {
  id: string;
  title: string;
  created_at: string;
  pastes: (PasteListItem & { content?: string })[];
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

export async function listPastes(params?: {
  q?: string;
  page?: number;
  limit?: number;
}): Promise<PasteListResponse> {
  const query = new URLSearchParams();
  if (params?.q) query.set('q', params.q);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const res = await fetch(`${BASE}?${query}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to list pastes');
  }
  return res.json();
}

export async function deletePaste(id: string, deleteCode: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deleteCode }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete paste');
  }
}

export async function createCollection(data: {
  title: string;
  paste_ids: string[];
}): Promise<{ id: string }> {
  const res = await fetch('/api/collections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create gist');
  }
  return res.json();
}

export async function getCollection(id: string): Promise<Collection> {
  const res = await fetch(`/api/collections/${id}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Gist not found');
  }
  return res.json();
}

export async function listCollections(params?: {
  page?: number;
  limit?: number;
}): Promise<CollectionListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const res = await fetch(`/api/collections?${query}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to list collections');
  }
  return res.json();
}

export async function deleteCollection(id: string, deleteCode: string): Promise<void> {
  const res = await fetch(`/api/collections/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deleteCode }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete gist');
  }
}

export async function updateCollection(
  id: string,
  deleteCode: string,
  data: { title?: string; paste_ids?: string[] }
): Promise<void> {
  const res = await fetch(`/api/collections/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deleteCode, ...data }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update gist');
  }
}

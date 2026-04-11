const STORAGE_KEY = 'pastebin_recent';
const MAX_RECENT = 8;

export interface RecentPaste {
  id: string;
  title: string | null;
  language: string;
  created_at: string;
}

export function useRecentPastes() {
  const getAll = (): RecentPaste[] => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    } catch {
      return [];
    }
  };

  const add = (paste: RecentPaste) => {
    const all = getAll().filter((p) => p.id !== paste.id);
    all.unshift(paste);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, MAX_RECENT)));
  };

  return { getAll, add };
}

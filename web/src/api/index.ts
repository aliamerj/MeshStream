export const listFiles = async (path: string) => {
  const res = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message ?? "Failed to load files");
  }
  return res.json();
};

export function fileContentUrl(path: string): string {
  return `/api/files/content?path=${encodeURIComponent(path)}`;
}

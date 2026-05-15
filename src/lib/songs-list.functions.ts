import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

export type RemoteTrack = {
  title: string;
  artist: string;
  url: string;
  addedAt: string | null;
};

export const listSongs = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ ok: boolean; count: number; tracks: RemoteTrack[] }> => {
    const token = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "wanrifalremix-app",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(
        "https://api.github.com/repos/wanrifalgg/song/contents/?ref=main",
        { headers, cache: "no-store" }
      );
      if (!res.ok) {
        return { ok: false, count: 0, tracks: [] };
      }
      const items: Array<{ name: string; type: string }> = await res.json();
      const files = items.filter(
        (it) => it.type === "file" && /\.mp3$/i.test(it.name)
      );

      // Fetch latest commit per file to derive "added/updated" date
      const dateByName = new Map<string, string | null>();
      await Promise.all(
        files.map(async (f) => {
          try {
            const cRes = await fetch(
              `https://api.github.com/repos/wanrifalgg/song/commits?path=${encodeURIComponent(
                f.name
              )}&per_page=1`,
              { headers, cache: "no-store" }
            );
            if (!cRes.ok) {
              dateByName.set(f.name, null);
              return;
            }
            const arr: Array<{
              commit?: { committer?: { date?: string }; author?: { date?: string } };
            }> = await cRes.json();
            const date =
              arr[0]?.commit?.committer?.date ??
              arr[0]?.commit?.author?.date ??
              null;
            dateByName.set(f.name, date);
          } catch {
            dateByName.set(f.name, null);
          }
        })
      );

      const tracks: RemoteTrack[] = files
        .map((it) => ({
          title: it.name.replace(/\.mp3$/i, ""),
          artist: "WanrifalRemix",
          url:
            "https://cdn.jsdelivr.net/gh/wanrifalgg/song@main/" +
            encodeURIComponent(it.name),
          addedAt: dateByName.get(it.name) ?? null,
        }))
        .sort((a, b) =>
          a.title.localeCompare(b.title, "id", { sensitivity: "base" })
        );

      setResponseHeader("Cache-Control", "public, max-age=60");
      return { ok: tracks.length > 0, count: tracks.length, tracks };
    } catch {
      return { ok: false, count: 0, tracks: [] };
    }
  }
);

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const REPO_OWNER = "wanrifalgg";
const REPO_NAME = "song";
const BRANCH = "main";
const CDN_BASE = `https://cdn.jsdelivr.net/gh/${REPO_OWNER}/${REPO_NAME}@${BRANCH}/`;
const ADMIN_PASSWORD = "wanrifal101993";

const inputSchema = z.object({
  filename: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-zA-Z0-9 ._-]+\.mp3$/i, "Nama file hanya boleh huruf/angka/spasi/._- dan berakhiran .mp3"),
  title: z.string().min(1).max(200),
  contentBase64: z.string().min(10).max(35_000_000), // ~25MB binary -> ~33MB base64
  adminPassword: z.string().min(1).max(200),
});

type GhContent = { sha?: string; content?: string };

async function gh(path: string, init: RequestInit, token: string) {
  return fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "wanrifalremix-uploader",
      ...(init.headers || {}),
    },
  });
}

async function commitListJson(
  token: string,
  newEntry: { title: string; url: string },
  attempt = 0,
): Promise<void> {
  const getRes = await gh(`list.json?ref=${BRANCH}`, { method: "GET" }, token);
  let sha: string | undefined;
  let songs: { title: string; url: string }[] = [];

  if (getRes.ok) {
    const data = (await getRes.json()) as GhContent;
    sha = data.sha;
    if (data.content) {
      try {
        const decoded = atob(data.content.replace(/\n/g, ""));
        const parsed = JSON.parse(decoded);
        if (Array.isArray(parsed?.songs)) songs = parsed.songs;
      } catch {
        /* start fresh if corrupt */
      }
    }
  } else if (getRes.status !== 404) {
    throw new Error(`Gagal membaca list.json: ${getRes.status}`);
  }

  // Skip duplicates by url
  if (!songs.some((s) => s.url === newEntry.url)) {
    songs.push(newEntry);
  }

  const body = {
    message: `chore: add ${newEntry.title}`,
    content: btoa(JSON.stringify({ songs }, null, 2)),
    branch: BRANCH,
    ...(sha ? { sha } : {}),
  };

  const putRes = await gh(`list.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }, token);

  if (!putRes.ok) {
    if ((putRes.status === 409 || putRes.status === 422) && attempt < 1) {
      return commitListJson(token, newEntry, attempt + 1);
    }
    const text = await putRes.text();
    throw new Error(`Gagal update list.json: ${putRes.status} ${text}`);
  }
}

export const uploadSong = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    if (data.adminPassword !== ADMIN_PASSWORD) {
      throw new Error("Password admin salah");
    }
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("GITHUB_TOKEN belum diset");

    const filename = data.filename.trim();

    // Check if file already exists
    const existing = await gh(`${encodeURIComponent(filename)}?ref=${BRANCH}`, { method: "GET" }, token);
    if (existing.ok) {
      throw new Error(`File "${filename}" sudah ada di repo`);
    }

    // Upload mp3
    const putRes = await gh(encodeURIComponent(filename), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `chore: upload ${filename}`,
        content: data.contentBase64,
        branch: BRANCH,
      }),
    }, token);

    if (!putRes.ok) {
      const text = await putRes.text();
      throw new Error(`Gagal upload file: ${putRes.status} ${text}`);
    }

    const url = CDN_BASE + encodeURI(filename);
    await commitListJson(token, { title: data.title.trim(), url });

    // Purge jsDelivr CDN cache so list.json & file mp3 baru langsung fresh
    try {
      await purgeJsdelivr([
        `/gh/${REPO_OWNER}/${REPO_NAME}@${BRANCH}/list.json`,
        `/gh/${REPO_OWNER}/${REPO_NAME}@${BRANCH}/${encodeURI(filename)}`,
      ]);
    } catch (e) {
      console.error("jsDelivr purge gagal (non-fatal):", e);
    }

    return { success: true, url, title: data.title.trim() };
  });

async function purgeJsdelivr(paths: string[]): Promise<void> {
  const res = await fetch("https://purge.jsdelivr.net/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: paths }),
  });
  if (!res.ok) {
    throw new Error(`Purge gagal: ${res.status} ${await res.text()}`);
  }
}

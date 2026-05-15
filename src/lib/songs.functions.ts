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

const deleteSchema = z.object({
  filename: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-zA-Z0-9 ._-]+\.mp3$/i, "Nama file tidak valid"),
  adminPassword: z.string().min(1).max(200),
});

async function commitListJsonRemove(token: string, urlToRemove: string, attempt = 0): Promise<void> {
  const getRes = await gh(`list.json?ref=${BRANCH}`, { method: "GET" }, token);
  if (!getRes.ok) {
    if (getRes.status === 404) return;
    throw new Error(`Gagal membaca list.json: ${getRes.status}`);
  }
  const data = (await getRes.json()) as GhContent;
  let songs: { title: string; url: string }[] = [];
  if (data.content) {
    try {
      const decoded = atob(data.content.replace(/\n/g, ""));
      const parsed = JSON.parse(decoded);
      if (Array.isArray(parsed?.songs)) songs = parsed.songs;
    } catch { /* ignore */ }
  }
  const filtered = songs.filter((s) => s.url !== urlToRemove);
  if (filtered.length === songs.length) return;

  const putRes = await gh(`list.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `chore: remove song`,
      content: btoa(JSON.stringify({ songs: filtered }, null, 2)),
      branch: BRANCH,
      sha: data.sha,
    }),
  }, token);

  if (!putRes.ok) {
    if ((putRes.status === 409 || putRes.status === 422) && attempt < 1) {
      return commitListJsonRemove(token, urlToRemove, attempt + 1);
    }
    throw new Error(`Gagal update list.json: ${putRes.status} ${await putRes.text()}`);
  }
}

export const deleteSong = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => deleteSchema.parse(input))
  .handler(async ({ data }) => {
    if (data.adminPassword !== ADMIN_PASSWORD) {
      throw new Error("Password admin salah");
    }
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("GITHUB_TOKEN belum diset");

    const filename = data.filename.trim();
    const encoded = encodeURIComponent(filename);

    // Get sha for the file
    const meta = await gh(`${encoded}?ref=${BRANCH}`, { method: "GET" }, token);
    if (meta.status === 404) {
      // File sudah tidak ada — tetap bersihkan list.json
      const url = CDN_BASE + encodeURI(filename);
      await commitListJsonRemove(token, url);
      return { success: true, removed: false };
    }
    if (!meta.ok) {
      throw new Error(`Gagal cek file: ${meta.status}`);
    }
    const metaJson = (await meta.json()) as GhContent;
    if (!metaJson.sha) throw new Error("SHA file tidak ditemukan");

    const delRes = await gh(encoded, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `chore: delete ${filename}`,
        sha: metaJson.sha,
        branch: BRANCH,
      }),
    }, token);
    if (!delRes.ok) {
      throw new Error(`Gagal hapus file: ${delRes.status} ${await delRes.text()}`);
    }

    const url = CDN_BASE + encodeURI(filename);
    await commitListJsonRemove(token, url);

    try {
      await purgeJsdelivr([
        `/gh/${REPO_OWNER}/${REPO_NAME}@${BRANCH}/list.json`,
        `/gh/${REPO_OWNER}/${REPO_NAME}@${BRANCH}/${encodeURI(filename)}`,
      ]);
    } catch (e) {
      console.error("jsDelivr purge gagal (non-fatal):", e);
    }

    return { success: true, removed: true };
  });

const renameSchema = z.object({
  oldFilename: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-zA-Z0-9 ._-]+\.mp3$/i, "Nama file lama tidak valid"),
  newName: z
    .string()
    .min(1)
    .max(196)
    .regex(/^[a-zA-Z0-9 ._-]+$/, "Nama baru hanya boleh huruf/angka/spasi/._-"),
  adminPassword: z.string().min(1).max(200),
});

async function commitListJsonReplace(
  token: string,
  oldUrl: string,
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
      } catch { /* ignore */ }
    }
  } else if (getRes.status !== 404) {
    throw new Error(`Gagal membaca list.json: ${getRes.status}`);
  }

  let replaced = false;
  songs = songs.map((s) => {
    if (s.url === oldUrl) { replaced = true; return newEntry; }
    return s;
  });
  if (!replaced) songs.push(newEntry);

  const putRes = await gh(`list.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `chore: rename to ${newEntry.title}`,
      content: btoa(JSON.stringify({ songs }, null, 2)),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  }, token);

  if (!putRes.ok) {
    if ((putRes.status === 409 || putRes.status === 422) && attempt < 1) {
      return commitListJsonReplace(token, oldUrl, newEntry, attempt + 1);
    }
    throw new Error(`Gagal update list.json: ${putRes.status} ${await putRes.text()}`);
  }
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)),
    );
  }
  return btoa(binary);
}

export const renameSong = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => renameSchema.parse(input))
  .handler(async ({ data }) => {
    if (data.adminPassword !== ADMIN_PASSWORD) {
      throw new Error("Password admin salah");
    }
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("GITHUB_TOKEN belum diset");

    const oldFilename = data.oldFilename.trim();
    const newName = data.newName.trim();
    const newFilename = `${newName}.mp3`;
    const oldUrl = CDN_BASE + encodeURI(oldFilename);
    const newUrl = CDN_BASE + encodeURI(newFilename);

    // Same filename => only update title in list.json (idempotent)
    if (oldFilename.toLowerCase() === newFilename.toLowerCase()) {
      await commitListJsonReplace(token, oldUrl, { title: newName, url: oldUrl });
      try {
        await purgeJsdelivr([`/gh/${REPO_OWNER}/${REPO_NAME}@${BRANCH}/list.json`]);
      } catch (e) { console.error("purge gagal:", e); }
      return { success: true, url: oldUrl, title: newName };
    }

    // Pastikan file baru belum ada
    const existsNew = await gh(`${encodeURIComponent(newFilename)}?ref=${BRANCH}`, { method: "GET" }, token);
    if (existsNew.ok) {
      throw new Error(`File "${newFilename}" sudah ada di repo`);
    }

    // Ambil SHA & isi file lama
    const oldEncoded = encodeURIComponent(oldFilename);
    const oldMetaRes = await gh(`${oldEncoded}?ref=${BRANCH}`, { method: "GET" }, token);
    if (!oldMetaRes.ok) {
      throw new Error(`File lama tidak ditemukan: ${oldMetaRes.status}`);
    }
    const oldMeta = (await oldMetaRes.json()) as GhContent;
    if (!oldMeta.sha) throw new Error("SHA file lama tidak ditemukan");

    // Ambil bytes via raw.githubusercontent (mendukung file besar)
    const rawRes = await fetch(
      `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${encodeURI(oldFilename)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!rawRes.ok) {
      throw new Error(`Gagal mengunduh file lama: ${rawRes.status}`);
    }
    const buf = await rawRes.arrayBuffer();
    const contentBase64 = arrayBufferToBase64(buf);

    // Upload file baru
    const putNew = await gh(encodeURIComponent(newFilename), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `chore: rename ${oldFilename} -> ${newFilename}`,
        content: contentBase64,
        branch: BRANCH,
      }),
    }, token);
    if (!putNew.ok) {
      throw new Error(`Gagal upload nama baru: ${putNew.status} ${await putNew.text()}`);
    }

    // Hapus file lama
    const delOld = await gh(oldEncoded, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `chore: remove old ${oldFilename}`,
        sha: oldMeta.sha,
        branch: BRANCH,
      }),
    }, token);
    if (!delOld.ok) {
      // Non-fatal: file baru sudah ada, lanjut update list.json
      console.error("Gagal hapus file lama:", delOld.status, await delOld.text());
    }

    await commitListJsonReplace(token, oldUrl, { title: newName, url: newUrl });

    try {
      await purgeJsdelivr([
        `/gh/${REPO_OWNER}/${REPO_NAME}@${BRANCH}/list.json`,
        `/gh/${REPO_OWNER}/${REPO_NAME}@${BRANCH}/${encodeURI(oldFilename)}`,
        `/gh/${REPO_OWNER}/${REPO_NAME}@${BRANCH}/${encodeURI(newFilename)}`,
      ]);
    } catch (e) {
      console.error("jsDelivr purge gagal (non-fatal):", e);
    }

    return { success: true, url: newUrl, title: newName };
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

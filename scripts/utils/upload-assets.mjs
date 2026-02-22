#!/usr/bin/env node
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import process from 'process';
import pLimit from 'p-limit';
import { createClient } from '@supabase/supabase-js';
// example: node scripts/upload-assets.mjs /Users/zhaoyu/Desktop/husbando-land/public/assets/images/

// TODO 修改为实际的supabase url和key
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PUBLIC ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    'Missing Supabase envs. Provide NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY_PUBLIC (or NEXT_PUBLIC_SUPABASE_ANON_KEY).',
  );
  process.exit(1);
}

const BUCKET = 'husbando-land';
// TODO 上传文件路径
const DEST_PREFIX = 'assets/examples/video-to-video'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Minimal mime lookup without new deps
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.webp':
      return 'image/webp';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    case '.mp4':
      return 'video/mp4';
    case '.webm':
      return 'video/webm';
    case '.mov':
    case '.qt':
      return 'video/quicktime';
    case '.m4v':
      return 'video/x-m4v';
    case '.mp3':
      return 'audio/mpeg';
    case '.wav':
      return 'audio/wav';
    case '.ogg':
      return 'audio/ogg';
    case '.txt':
      return 'text/plain; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.html':
      return 'text/html; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    default:
      return 'application/octet-stream';
  }
}

async function listFilesRecursive(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const res = path.join(dir, entry.name);
      if (entry.isDirectory()) return listFilesRecursive(res);
      if (entry.isFile()) return res;
      return [];
    }),
  );
  return files.flat();
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

async function uploadOne(localFile, baseDir) {
  const rel = path.relative(baseDir, localFile);
  const destPath = `${DEST_PREFIX}/${toPosix(rel)}`; // assets/<rel>
  const contentType = getMimeType(localFile);
  const buffer = await fsp.readFile(localFile);

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(destPath, buffer, {
      contentType,
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadErr) {
    throw new Error(`Upload failed for ${localFile} -> ${destPath}: ${uploadErr.message}`);
  }

  const { data: pub } = await supabase.storage.from(BUCKET).getPublicUrl(destPath);
  return { local: localFile, path: destPath, url: pub?.publicUrl };
}

async function main() {
  const inputPath = process.argv[2] || '/tmp';
  const absInput = path.isAbsolute(inputPath)
    ? inputPath
    : path.resolve(process.cwd(), inputPath);

  const stat = await fsp.stat(absInput).catch(() => null);
  if (!stat || !stat.isDirectory()) {
    console.error(`Input path is not a directory: ${absInput}`);
    process.exit(1);
  }

  const allFiles = (await listFilesRecursive(absInput)).filter((p) => fs.statSync(p).isFile());
  if (allFiles.length === 0) {
    console.log('No files found to upload.');
    return;
  }

  console.log(`Uploading ${allFiles.length} files from ${absInput} to ${BUCKET}/${DEST_PREFIX} ...`);
  const limit = pLimit(6);

  let success = 0;
  let fail = 0;
  const results = await Promise.all(
    allFiles.map((f) =>
      limit(async () => {
        try {
          const r = await uploadOne(f, absInput);
          success += 1;
          console.log(`[OK] ${r.local} -> ${r.url || r.path}`);
          return r;
        } catch (e) {
          fail += 1;
          console.error(`[FAIL] ${f}: ${e.message || e}`);
          return null;
        }
      }),
    ),
  );

  console.log(`Done. Success: ${success}, Failed: ${fail}`);
  // Print a compact mapping summary
  const uploaded = results.filter(Boolean);
  if (uploaded.length > 0) {
    console.log('Uploaded files:');
    for (const r of uploaded) {
      console.log(`- ${r.path}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});



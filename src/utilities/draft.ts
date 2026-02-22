import { openDB, type DBSchema } from 'idb';
import { debounce } from 'lodash-es';

// draft 生命周期
// 1. 调用saveDraft保存内容，draft 内容一直存在直到消费
// 2. 使用consumeDraft消费内容，消费后 draft 内容被删除
// 3. 如果设置了ttl，draft过期后也会被删除
type DraftValue = {
  value: string;
  updatedAt: number; // Date.now()
  consumed?: boolean;
  ttl?: number; // 可选：过期毫秒
};

interface DraftDB extends DBSchema {
  drafts: {
    key: string; // `${pageKey}:${fieldKey}`
    value: DraftValue;
  };
}

const DB_NAME = 'app_drafts';
const STORE = 'drafts';

// 防止node环境报错
const dbp = () =>
  openDB<DraftDB>(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE);
    },
  });

function keyOf(pageKey: string, fieldKey = 'default') {
  return `${pageKey}:${fieldKey}`;
}

// 软失败回退 localStorage
function setLS(k: string, v: DraftValue) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}
function getLS(k: string): DraftValue | undefined {
  try {
    const s = localStorage.getItem(k);
    return s ? JSON.parse(s) : undefined;
  } catch {
    return undefined;
  }
}

function delLS(k: string) {
  try {
    localStorage.removeItem(k);
  } catch {}
}

export async function saveDraft(
  pageKey: string,
  value: string,
  fieldKey = 'default',
  opts?: { ttl?: number },
) {
  const record: DraftValue = { value, updatedAt: Date.now(), ttl: opts?.ttl };
  const k = keyOf(pageKey, fieldKey);
  try {
    const db = await dbp();
    console.log('saveDraft', k, record);
    await db.put(STORE, record, k);
  } catch {
    setLS(k, record);
  }
}

export async function loadDraft(
  pageKey: string,
  fieldKey = 'default',
): Promise<string | undefined> {
  const k = keyOf(pageKey, fieldKey);
  let rec: DraftValue | undefined;
  try {
    const db = await dbp();
    rec = (await db.get(STORE, k)) ?? getLS(k);
  } catch {
    rec = getLS(k);
  }
  if (!rec) return undefined;
  if (rec.ttl && Date.now() - rec.updatedAt > rec.ttl) {
    // 过期自动清理
    await deleteDraft(pageKey, fieldKey);
    return undefined;
  }
  if (rec.consumed) return undefined;
  return rec.value;
}

export async function deleteDraft(pageKey: string, fieldKey = 'default') {
  const k = keyOf(pageKey, fieldKey);
  try {
    const db = await dbp();
    await db.delete(STORE, k);
  } catch {
    delLS(k);
  }
}

export async function consumeDraft(pageKey: string, fieldKey = 'default') {
  // 简单起见：直接删除。如果想保留记录，可改成 set consumed=true
  await deleteDraft(pageKey, fieldKey);
}

export const debouncedSaveDraft = debounce(saveDraft, 60);
export const getDraft = (
  pageKey: string,
  setPrompt: (prompt: string) => void,
) => {
  loadDraft(pageKey).then(draft => {
    if (!draft) {
      return;
    }
    setPrompt(draft);
  });
};

// page key
export const AI_ANIME_GENERATOR = 'ai-anime-generator';
export const AI_COMIC_GENERATOR = 'ai-comic-generator';
export const IMAGE_ANIMATION_GENERATOR = 'image-animation-generator';
export const OC_MAKER = 'oc-maker';

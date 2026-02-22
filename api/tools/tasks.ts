import { createSupabase } from "../_utils/index.js";
import { getWSClient } from "./_ws.js";
import sharp from 'sharp'
import { getAuthUserId } from "./image-generation.js";
import { getHistoryImageUrl } from "../_utils/index.js";
import { serverUrl } from "./_constants.js";


export enum TaskStatus {
  FAILED = -1,
  COMPLETED = 0,
  PROCESSING = 1,
}


const supabase = createSupabase();

export async function uploadFile(
  bucketName: string,
  filePath: string,
  fileData: File | Blob | ArrayBuffer | string | Uint8Array | FormData | Buffer
) {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileData);
    const { data } = await supabase.storage.from(bucketName).getPublicUrl(filePath);
    if (error) throw error
    return data.publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    throw error
  }
}

export async function fetchAndConvert(url: string) {
  const response = await fetch(url)
  const blob = await response.arrayBuffer()
  const image = sharp(blob)
  return image.webp({ quality: 80 }).toBuffer()
}

interface UpdateTaskParams {
  prompt_id: string,
  status: TaskStatus,
  url?: string,
  userId?: string,
  tool?: string,
  prompt?: string,
  model?: string
}
const updateTask = async ({ prompt_id, status, url, userId, tool, prompt, model }: UpdateTaskParams) => {
  if (!userId) {
    const { error } = await supabase.from('Tasks').update({
      status,
    }).eq('id', prompt_id);
    if (!error) {
      return true;
    }
    return false;
  }
  const { error: updateError } = await supabase.rpc('updateTaskAndImageGeneration', {
    p_prompt_id: prompt_id,
    p_status: status,
    p_url: url,
    p_user_id: userId,
    p_tool: tool,
    p_prompt: prompt,
    p_model: model,
  })

  if (updateError) {
    console.error(updateError);
    return false;
  }
  return true;
}

const updateTaskAndUploadImage = async (data: string, userId: string) => {
  let json: any = null
  try {
    json = JSON.parse(data);
    if (json.type !== 'progress' || json.max !== json.value) {
      return false;
    }
    const { data: task, error } = await supabase.from('Tasks')
      .select('id,status,type,prompt')
      .eq('id', json.prompt_id)
      .limit(1)
      .single();

    if (error) {
      console.error(error);
      return false
    }

    const imageUrlResult = await getHistoryImageUrl(json.prompt_id, task.type);
    if (!imageUrlResult.url) {
      await updateTask({
        prompt_id: json.prompt_id,
        status: TaskStatus.FAILED,
      });
      return false;
    }
    
    const imageBuffer = await fetchAndConvert(imageUrlResult.url);

    if (!imageBuffer) {
      await updateTask({
        prompt_id: json.prompt_id,
        status: TaskStatus.FAILED,
      });
      return false;
    }

    const imagePath = `app_media/${crypto.randomUUID()}.webp`;
    const result = await uploadFile('husbando-land', imagePath, imageBuffer);
    if (!result) {
      return false;
    }
    return await updateTask({
      prompt_id: json.prompt_id,
      status: TaskStatus.COMPLETED,
      url: result,
      userId: userId,
      tool: task.type,
      prompt: task.prompt,
    });

  } catch (e) {
    console.error(e);
    return false
  }
}

export const getQueueStatus = async () => {
  const response = await fetch(`${serverUrl}/queue`);
  return response.json();
}

export const detectQueueIdle = (timeout: number, cleanup: () => void) => {
  let timer: NodeJS.Timeout | null = null;
  let running = true;

  const detect = async () => {
    try {
      const queueStatus = await getQueueStatus();
      if (!queueStatus || (!queueStatus.queue_running?.length && !queueStatus.queue_pending?.length)) {
        stopDetection();
      }
    } catch (e) {
      stopDetection();
    }
  }

  const stopDetection = () => {
    running = false;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    cleanup();
  }

  const resetTimer = () => {
    if (!running) return;

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      detect();
      resetTimer();
    }, timeout);
  }

  resetTimer();

  return {
    reset: resetTimer,
    stop: stopDetection
  };
}

export async function GET(request: Request) {
  const wsClient = getWSClient();
  const encoder = new TextEncoder();
  const userId = await getAuthUserId(request);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  let handleMessage: (data: string) => void;
  let queueDetector: any = null;

  const customReadable = new ReadableStream({
    start(controller) {
      const cleanup = () => {
        wsClient.off('message', handleMessage);
        controller.close();
        wsClient.close();
      };

      queueDetector = detectQueueIdle(1000, cleanup);

      handleMessage = async (data: string) => {
        let json: any = null
        try {
          json = JSON.parse(data);
          if (json.type === 'status' && !json.data?.status?.exec_info?.queue_remaining) {
            queueDetector.stop();
            console.log('queueDetector.stop');
            return;
          }

          // if (json.type === 'progress') {
          //   await updateTaskAndUploadImage(data, userId)
          // }
          queueDetector.reset();
        } catch (e) {
          console.error(e);
        }
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      wsClient.on('message', handleMessage);

      request.signal.addEventListener('abort', queueDetector.stop, { once: true });
      request.signal.addEventListener('close', queueDetector.stop, { once: true });
    },
    cancel() {
      queueDetector.stop();
    }
  });

  const response = new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    },
  });

  return response;
}

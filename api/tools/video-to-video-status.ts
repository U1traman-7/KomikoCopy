import Replicate from "replicate";
import { createClient } from '@supabase/supabase-js';
import { getPredictionVideoMapping, deletePredictionVideoMapping } from './video-to-video.js';

const replicate = new Replicate({
  auth: process.env.REPLICATE_TEST_COG_COMFYUI_API_TOKEN
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Extract progress information from logs
function extractProgressFromLogs(logs: string): { progress: number; currentStep: string } {
  if (!logs) return { progress: 0, currentStep: 'Initializing...' };

  // Look for ComfyUI progress indicators like "73%|███████▎  | 17/22"
  const progressMatches = logs.match(/(\d+)%\|[^|]*\|\s*(\d+)\/(\d+)/g);
  if (progressMatches && progressMatches.length > 0) {
    // Get the last (most recent) progress match
    const lastMatch = progressMatches[progressMatches.length - 1];
    const percentMatch = lastMatch.match(/(\d+)%/);
    const stepMatch = lastMatch.match(/(\d+)\/(\d+)/);
    
    if (percentMatch) {
      const percentage = parseInt(percentMatch[1]);
      let currentStep = 'Processing...';
      
      if (stepMatch) {
        currentStep = `Processing step ${stepMatch[1]}/${stepMatch[2]}...`;
      }
      
      return { progress: Math.min(percentage, 90), currentStep };
    }
  }

  // Extract current step from logs
  let currentStep = 'Processing...';
  if (logs.includes('Loading transformer parameters')) {
    currentStep = 'Loading AI model...';
  } else if (logs.includes('Moving video model')) {
    currentStep = 'Preparing video model...';
  } else if (logs.includes('WanVideo TextEncode')) {
    currentStep = 'Processing text prompt...';
  } else if (logs.includes('WanVideo Sampler')) {
    currentStep = 'Generating video frames...';
  } else if (logs.includes('Sampling') && logs.includes('frames')) {
    // Extract frame info like "Sampling 121 frames at 576x768"
    const frameMatch = logs.match(/Sampling (\d+) frames at (\d+x\d+)/);
    if (frameMatch) {
      currentStep = `Sampling ${frameMatch[1]} frames (${frameMatch[2]})...`;
    } else {
      currentStep = 'Sampling video frames...';
    }
  }

  // Fallback progress calculation
  const progressIndicators = [
    'Checking inputs',
    'Checking weights', 
    'Running workflow',
    'got prompt',
    'Executing node',
    'Loading transformer parameters',
    'Moving video model',
    'Sampler'
  ];

  let completedSteps = 0;
  for (const indicator of progressIndicators) {
    if (logs.includes(indicator)) {
      completedSteps++;
    }
  }

  const progress = Math.floor((completedSteps / progressIndicators.length) * 80) + 10;
  return { progress: Math.min(progress, 90), currentStep };
}

// 删除视频文件
async function deleteVideoFile(predictionId: string) {
  try {
    // 从映射表获取视频URL
    const mapping = await getPredictionVideoMapping(predictionId);
    
    if (!mapping) {
      console.log(`No mapping found for prediction ${predictionId}`);
      return false;
    }

    const videoUrl = mapping.video_url;
    if (!videoUrl) {
      console.log(`No video_url found for prediction ${predictionId}`);
      return true;
    }

    // 解析 Supabase Storage URL 获取文件路径
    const urlParts = videoUrl.split('/');
    const bucketName = urlParts[urlParts.length - 2]; // "app_videos"
    const fileName = urlParts[urlParts.length - 1]; // "filename.mp4"
    const filePath = `${bucketName}/${fileName}`;

    console.log(`Attempting to delete file: ${filePath} from bucket: husbando-land`);

    // 删除 Supabase Storage 中的实际文件
    const { error: deleteError } = await supabase.storage
      .from('husbando-land')
      .remove([filePath]);

    if (deleteError) {
      console.error('Error deleting video file:', deleteError);
      return false;
    }

    // 删除映射记录
    await deletePredictionVideoMapping(predictionId);
    console.log(`Successfully deleted video file and mapping for prediction ${predictionId}`);

    return true;
  } catch (err) {
    console.error('Failed to delete video file:', err);
    return false;
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id parameter' }), { status: 400 });
    }
    
    const prediction = await replicate.predictions.get(id);
    
    // Extract progress information from logs on backend
    let progressInfo = { progress: 0, currentStep: 'Initializing...' };
    if (prediction.status === 'processing' && prediction.logs) {
      progressInfo = extractProgressFromLogs(prediction.logs);
    } else if (prediction.status === 'starting') {
      progressInfo = { progress: 5, currentStep: 'Initializing...' };
    } else if (prediction.status === 'succeeded') {
      progressInfo = { progress: 100, currentStep: 'Completed!' };
      await deleteVideoFile(id);
    } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
      progressInfo = { progress: 0, currentStep: 'Failed' };
    }
    
    // Return clean response without logs
    const response = {
      status: prediction.status,
      output: prediction.output,
      error: prediction.error,
      started_at: prediction.started_at,
      completed_at: prediction.completed_at,
      // Include processed progress information instead of raw logs
      progress: progressInfo.progress,
      currentStep: progressInfo.currentStep,
    };
    
    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch prediction status:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Failed to fetch prediction status' }), { status: 500 });
  }
} 
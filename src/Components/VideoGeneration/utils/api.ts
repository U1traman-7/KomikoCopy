import toast from 'react-hot-toast';

type VideoApiParams = {
  method: 'getVideos' | 'generateVideo' | 'deleteVideo';
  tool: string;
  [key: string]: any;
};

interface VideosResponse {
  data: any[];
  error?: string;
}

export const videosAPI = async (
  params: VideoApiParams,
): Promise<VideosResponse> => {
  const response = await fetch('/api/tools/video-generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    toast.error(data.error);
    throw new Error(data.error);
  }
  return data;
};


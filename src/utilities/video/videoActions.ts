import toast from 'react-hot-toast';
import { TFunction } from 'i18next';
import { videosAPI } from '../../Components/VideoGeneration/utils/api';

// 通用 toast 配置
export const TOAST_CONFIG = {
  position: 'top-center' as const,
  style: {
    background: '#555',
    color: '#fff',
  },
};

/**
 * 显示成功 toast
 */
export const showSuccessToast = (message: string) => {
  toast.success(message, TOAST_CONFIG);
};

/**
 * 显示错误 toast
 */
export const showErrorToast = (message: string) => {
  toast.error(message, TOAST_CONFIG);
};

/**
 * 下载视频
 */
export const handleVideoDownload = async (
  videoUrl: string,
  t: TFunction,
): Promise<void> => {
  try {
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `result-${Date.now()}.mp4`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
    showErrorToast(t('toast:imageToVideo.downloadFailed'));
  }
};

/**
 * 删除视频（支持多个 tool）
 */
export const handleVideoDelete = async (
  videoId: number,
  tools: string[],
  t: TFunction,
): Promise<boolean> => {
  try {
    // 尝试从所有可能的 tool 中删除
    const deletePromises = tools.map(tool =>
      videosAPI({
        method: 'deleteVideo',
        tool,
        id: videoId,
      }).catch(() => ({ data: [] })),
    );

    const responses = await Promise.all(deletePromises);

    const success = responses.some(
      response => response.data && response.data.length > 0,
    );

    if (success) {
      showSuccessToast(t('toast:imageToVideo.deleteSuccess'));
      return true;
    } else {
      showErrorToast(t('toast:imageToVideo.deleteFailed'));
      return false;
    }
  } catch (error) {
    console.error('deleteVideo failed', error);
    showErrorToast(t('toast:imageToVideo.deleteFailed'));
    return false;
  }
};

/**
 * 处理删除点击（包含本地临时视频的处理）
 */
export const handleDeleteClick = (
  videoId: number,
  setResultVideos: React.Dispatch<React.SetStateAction<any[]>>,
  setVideoToDelete: (id: number | null) => void,
  setDeleteModalOpen: (open: boolean) => void,
) => {
  // 本地临时视频（id < 0）直接删除
  if (typeof videoId === 'number' && videoId < 0) {
    setResultVideos(resultVideos =>
      resultVideos.filter(d => d.id !== videoId),
    );
    return;
  }
  
  // 服务器视频需要确认
  setVideoToDelete(videoId);
  setDeleteModalOpen(true);
};

/**
 * 确认删除视频
 */
export const handleConfirmDelete = async (
  videoToDelete: number | null,
  tools: string[],
  t: TFunction,
  setResultVideos: React.Dispatch<React.SetStateAction<any[]>>,
  setVideoToDelete: (id: number | null) => void,
  setDeleteModalOpen: (open: boolean) => void,
) => {
  setDeleteModalOpen(false);
  
  if (!videoToDelete) return;

  const success = await handleVideoDelete(videoToDelete, tools, t);
  
  if (success) {
    // 直接删除本地数据
    setResultVideos(oldData => {
      const index = oldData.findIndex(d => d.id === videoToDelete);
      if (index > -1) {
        oldData.splice(index, 1);
        return [...oldData];
      }
      return oldData;
    });
  }
  
  setVideoToDelete(null);
};


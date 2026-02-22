import { useEffect, useRef, useState } from 'react';
import {
  dispatchGenerated,
  VideoData,
  GenerationStatus as GenerationStatusSimple,
  filterValidVideo,
} from '../Components/ToolsPage/utils';
import { queryTask, submitTask, SubmitTaskParams } from '@/api/tools';
import { Polling } from '@/utils/polling';
import { toastError, toastWarn } from '../utilities';
import { useTranslation } from 'react-i18next';
import {
  ERROR_CODES,
  GenerationStatus,
  TASK_TYPES,
} from '../../api/_constants';
import { useAtom, useAtomValue } from 'jotai';
import { authAtom, profileAtom } from 'state';
import { useOpenModal } from './useOpenModal';
import toast from 'react-hot-toast';
import { isNil } from 'lodash-es';

export const useResId = () => {
  const resId = useRef(0);
  const oldResId = useRef(0);
  const resUrl = useRef('');
  return {
    resId,
    oldResId,
    resUrl,
  };
};

export interface VideoParams {
  tool: string | string[]; // Support single tool or multiple tools
  exampleVideoUrl: string;
  options?: {
    formatPrompt?: (params: any) => string;
    disableAutoInit?: boolean; // Disable automatic initialization
  };
}
export const useVideos = (
  tool: string | string[],
  exampleVideoUrl: string,
  { formatPrompt, disableAutoInit }: VideoParams['options'] = {},
) => {
  const { t } = useTranslation();
  const [resultVideos, setResultVideos] = useState<VideoData[]>([
    {
      id: -1,
      video_url: exampleVideoUrl,
      prompt: t('common:exampleResult'),
    },
  ]);

  const [profile, setProfile] = useAtom(profileAtom);

  const isAuth = useAtomValue(authAtom);

  const pollingList = useRef<number[]>([]);
  const polling = useRef(new Polling(5000));
  // avoid duplicate toasts per task
  const notifiedSuccess = useRef<Set<string | number>>(new Set());
  const notifiedTerminal = useRef<Set<string | number>>(new Set());

  // 查找 resultVideos 中匹配 taskId 的索引，同时支持 d.id 和 d.taskId 字段
  const findVideoIndex = (videos: VideoData[], taskId: number) => {
    let index = videos.findIndex(d => d.id === taskId);
    if (index === -1) {
      index = videos.findIndex(d => d.taskId === taskId);
    }
    return index;
  };

  const pollingTask = async () => {
    if (pollingList.current.length === 0) {
      polling.current.cancel();
      return;
    }
    const result = await queryTask({
      taskIds: pollingList.current,
      status: [
        GenerationStatus.SUCCEEDED,
        GenerationStatus.FAILED,
        GenerationStatus.FINISHED,
        GenerationStatus.REPLACED,
      ],
      // Do not filter by tool when querying explicit task IDs
    });
    if (!result.code) {
      polling.current.cancel();
      toastError(t('toast:error.videoGenerationFailed'));
      setResultVideos(resultVideos =>
        resultVideos.filter(d => !pollingList.current.includes(d.id)),
      );
      return;
    }
    const tasks = result.data.tasks;
    for (const task of tasks) {
      if (task.status === GenerationStatus.SUCCEEDED) {
        const videoUrl = task.output;
        // const prompt = task.prompt;
        // const model = task.model;
        const id = task.id;
        const generationId = task.generation_id;
        if (pollingList.current.length === 0) {
          polling.current.cancel();
        }

        await dispatchGenerated(id);
        setResultVideos(resultVideos => {
          const index = findVideoIndex(resultVideos, id);

          if (index > -1) {
            resultVideos[index] = {
              ...resultVideos[index],
              id: generationId ?? id,
              video_url: videoUrl,
              // prompt,
              status: GenerationStatusSimple.DONE,
              // model,
            };

            // Sort: generating tasks first, then by created_at descending, example video last
            const sorted = [...resultVideos].sort((a, b) => {
              if (a.id === -1) {
                return 1;
              }
              if (b.id === -1) {
                return -1;
              }
              if (
                a.status === GenerationStatusSimple.GENERATING &&
                b.status !== GenerationStatusSimple.GENERATING
              ) {
                return -1;
              }
              if (
                b.status === GenerationStatusSimple.GENERATING &&
                a.status !== GenerationStatusSimple.GENERATING
              ) {
                return 1;
              }
              const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
              const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
              return timeB - timeA;
            });

            return sorted;
          }
          return resultVideos;
        });

        if (!notifiedSuccess.current.has(id)) {
          notifiedSuccess.current.add(id);
          toast.success(t('toast:imageToVideo.generateSuccess'), {
            position: 'top-center',
            style: {
              background: '#555',
              color: '#fff',
            },
          });
        }
      } else if (
        task.status === GenerationStatus.PROCESSING ||
        task.status === GenerationStatus.PENDING
      ) {
        setResultVideos(resultVideos => {
          const index = findVideoIndex(resultVideos, task.id);
          if (index > -1) {
            // Always ensure the status is set for processing tasks
            resultVideos[index] = {
              ...resultVideos[index],
              status: GenerationStatusSimple.GENERATING,
            };
            return [...resultVideos];
          }
          // If task is not in the list yet, add it
          const newVideos = [
            {
              id: task.id,
              video_url: '',
              prompt: task.prompt || '',
              status: GenerationStatusSimple.GENERATING,
              created_at: new Date().toISOString(),
            },
            ...resultVideos,
          ];

          // Sort: generating tasks first, then by created_at descending, example video last
          newVideos.sort((a, b) => {
            if (a.id === -1) {
              return 1;
            }
            if (b.id === -1) {
              return -1;
            }
            if (
              a.status === GenerationStatusSimple.GENERATING &&
              b.status !== GenerationStatusSimple.GENERATING
            ) {
              return -1;
            }
            if (
              b.status === GenerationStatusSimple.GENERATING &&
              a.status !== GenerationStatusSimple.GENERATING
            ) {
              return 1;
            }
            const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return timeB - timeA;
          });

          return newVideos;
        });
      } else {
        if (
          (task.status === GenerationStatus.FAILED ||
            task.status === GenerationStatus.FINISHED) &&
          !notifiedTerminal.current.has(task.id)
        ) {
          // Handle error based on failure message and code
          if (
            task.failure &&
            /inappropriate content|nudity|sexuality|erotic|guardrails/i.test(
              task.failure,
            )
          ) {
            toastError(t('toast:error.videoGenerationFailed'));
          } else if (
            task.failure &&
            /no.*face.*found|face.*not.*found/i.test(task.failure)
          ) {
            toastError(t('toast:error.noFace'));
          } else if (
            task.failure &&
            /small.*face|face.*too.*small/i.test(task.failure)
          ) {
            toastError(t('toast:error.smallFace'));
          } else if (
            task.failure &&
            /internal.*error|server.*error/i.test(task.failure)
          ) {
            toastError(t('toast:error.videoGenerationFailed'));
          } else if (task.failureCode === 'NO_FACE_FOUND') {
            toastError(t('toast:error.noFace'));
          } else if (task.failureCode === 'SMALL_FACE') {
            toastError(t('toast:error.smallFace'));
          } else if (task.failureCode === 'SAFETY.INPUT.TEXT') {
            toastError(t('toast:error.videoGenerationFailed'));
          } else if (task.failureCode === 'INTERNAL.BAD_OUTPUT.CODE01') {
            toastError(t('toast:error.videoGenerationFailed'));
          } else if (task.failureCode === '500') {
            toastError(t('toast:error.videoGenerationFailed'));
          } else if (task.failureCode === '400') {
            toastError(t('toast:error.invalidParams'));
          } else if (task.failureCode) {
            // Other Act Two error codes
            toastError(t('toast:error.humanModeVideoGenerationFailed'));
          } else {
            // No specific error info
            toastError(t('toast:error.videoGenerationFailed'));
          }
          notifiedTerminal.current.add(task.id);
        }

        setResultVideos(resultVideos => {
          const index = findVideoIndex(resultVideos, task.id);
          if (index > -1) {
            // Remove failed tasks from the list
            resultVideos.splice(index, 1);
            return [...resultVideos];
          }
          return resultVideos;
        });
      }

      if (
        task.status !== GenerationStatus.PROCESSING &&
        task.status !== GenerationStatus.PENDING
      ) {
        removeTaskId(task.id);
      }
    }
  };

  const addTaskId = (...taskIds: number[]) => {
    for (const taskId of taskIds) {
      if (isNil(taskId) || pollingList.current.includes(taskId)) {
        return;
      }
      pollingList.current.push(taskId);
      if (polling.current.isPolling()) {
        return;
      }
      polling.current.start(pollingTask);
    }
  };

  const removeTaskId = (taskId: number) => {
    pollingList.current = pollingList.current.filter(id => id !== taskId);
  };

  const { submit: openModal } = useOpenModal();

  const submit = async (params: SubmitTaskParams) => {
    const result = await submitTask(params);
    if (!result.code) {
      if (result.error_code === ERROR_CODES.NOT_ENOUGH_ZAPS) {
        openModal('pricing');
      } else if (result.error_code === ERROR_CODES.RATE_LIMIT_EXCEEDED) {
        toastWarn(t('toast:common.rateLimitExceeded'));
        openModal('pricing');
      } else if (result.error_code === ERROR_CODES.GENERATION_MODEL_NOT_FOUND) {
        toastError(t('toast:error.generationModelNotFound'));
      } else if (result.error_code === ERROR_CODES.GENERATION_TASK_NOT_FOUND) {
        toastError(t('toast:error.generationTaskNotFound'));
      } else if (result.error_code === ERROR_CODES.INVALID_PARAMS) {
        toastError(t('toast:error.invalidParams'));
      } else {
        toastError(t('toast:error.videoGenerationFailed'));
      }
      return;
    }
    const taskId = result.data.task_ids[0];

    addTaskId(taskId);
    return taskId;
  };

  const queryGeneratingTask = async () => {
    const result = await queryTask({
      taskIds: pollingList.current,
      status: GenerationStatus.PROCESSING,
      type: TASK_TYPES.VIDEO,
    });
    if (!result.code) {
      return;
    }
    return result.data.tasks;
  };

  type VideoApiParams = {
    method: 'getVideos' | 'generateVideo' | 'deleteVideo';
    tool: string;
    [key: string]: any;
  };
  interface VideosResponse {
    data: VideoData[];
  }

  const videosAPI = async (params: VideoApiParams): Promise<VideosResponse> => {
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
      toastError(data.error);
      // throw new Error(data.error);
      return { data: [] };
    }
    return data;
  };

  const initResults = async () => {
    // Skip auto-init if disabled (component will handle initialization manually)
    if (disableAutoInit) {
      return;
    }

    const tools = Array.isArray(tool) ? tool : [tool];

    // Fetch from all tools in parallel
    const allResults = await Promise.all(
      tools.map(async t => {
        const [taskResult, videoResult] = await Promise.all([
          queryTask({
            status: GenerationStatus.PROCESSING,
            tool: t,
          }).catch(() => ({ data: { tasks: [] } })),
          videosAPI({
            method: 'getVideos',
            tool: t,
          }).catch(() => ({ data: [] })),
        ]);
        return {
          videos: videoResult?.data || [],
          tasks: taskResult?.data?.tasks || [],
        };
      }),
    );

    // Merge and deduplicate results from all tools
    const allVideos = allResults.flatMap(r => r.videos);
    const allTasks = allResults.flatMap(r => r.tasks);

    const videos = allVideos.filter(
      (video, index, self) => index === self.findIndex(v => v.id === video.id),
    );
    const tasks = allTasks.filter(
      (task, index, self) => index === self.findIndex(t => t.id === task.id),
    );

    // Filter valid videos before processing
    const validVideos = await filterValidVideo(videos);

    const resultVideos = validVideos.map(video => ({
      ...video,
      prompt: formatPrompt?.(video) ?? video.prompt,
    }));

    if (tasks.length > 0) {
      addTaskId(...tasks.map(task => task.id));
    }

    for (const task of tasks) {
      const index = resultVideos.findIndex(d => d.id === task.id);
      if (index > -1) {
        continue;
      }
      const prompt = formatPrompt ? formatPrompt(task) : task.prompt;
      resultVideos.unshift({
        id: task.id,
        video_url: '',
        prompt,
        status: GenerationStatusSimple.GENERATING,
        created_at: task.created_at || new Date().toISOString(), // 确保生成中的任务有时间戳
      });
    }
    if (resultVideos.length <= 0) {
      return;
    }

    // Sort: generating tasks first, then by created_at descending, example video last
    resultVideos.sort((a, b) => {
      // Example video (id: -1) always last
      if (a.id === -1) {
        return 1;
      }
      if (b.id === -1) {
        return -1;
      }
      // Generating tasks always first
      if (
        a.status === GenerationStatusSimple.GENERATING &&
        b.status !== GenerationStatusSimple.GENERATING
      ) {
        return -1;
      }
      if (
        b.status === GenerationStatusSimple.GENERATING &&
        a.status !== GenerationStatusSimple.GENERATING
      ) {
        return 1;
      }
      // Otherwise sort by created_at descending
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

    setResultVideos(resultVideos);
  };

  useEffect(() => {
    if (isAuth) {
      initResults();
    }
  }, [isAuth]);

  useEffect(
    () => () => {
      polling.current.cancel();
    },
    [],
  );

  return {
    resultVideos,
    setResultVideos,
    submitTask: submit,
    cancelPolling: () => {
      polling.current.cancel();
    },
    startPolling: () => {
      polling.current.start(pollingTask);
    },
    addTaskId,
    removeTaskId,
    queryGeneratingTask,
    profile,
    setProfile,
  };
};

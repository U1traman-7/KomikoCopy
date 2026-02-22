import { queryTask, submitTask } from '@/api/tools';
import { Polling } from './polling';
import { GenerationStatus, TASK_TYPES } from '../../api/_constants';
import { toastError } from '.';

const TaskPromiseMap = new Map<
  number,
  { promise: Promise<any>; resolve: (value: any) => void }
>();

const polling = new Polling(5000);
const pollingTaskIds = new Set<number>();

export const submitGenerationTask = async params => {
  const response = await submitTask(params);
  if (!response.code) {
    return { taskIds: [], error: response.error };
  }
  const taskIds = response.data.task_ids;

  taskIds.forEach(taskId => {
    let resolver = (value: any) => {};
    const promise = new Promise<any>(resolve => {
      resolver = resolve;
    }).finally(() => {
      TaskPromiseMap.delete(taskId);
    });
    TaskPromiseMap.set(taskId, { promise, resolve: resolver });
  });

  return {
    taskIds: response.data.task_ids,
  };
};

export const queryTaskPromise = (taskIds: number[]) =>
  taskIds.map(taskId => {
    const task = TaskPromiseMap.get(taskId);
    return task ? task.promise : Promise.resolve(null);
  });

const pollingImageTask = async () => {
  if (pollingTaskIds.size === 0) {
    polling.cancel();
    return;
  }
  const result = await queryTask({
    taskIds: Array.from(pollingTaskIds),
    status: [
      GenerationStatus.SUCCEEDED,
      GenerationStatus.FAILED,
      GenerationStatus.FINISHED,
      GenerationStatus.REPLACED,
    ],
    type: TASK_TYPES.IMAGE,
  });
  if (!result.code) {
    polling.cancel();
    // toastError(t('toast:error.videoGenerationFailed'));
    return;
  }
  const tasks = result.data.tasks;
  for (const task of tasks) {
    if (task.status === GenerationStatus.SUCCEEDED) {
      const imageUrl = task.output;
      // const prompt = task.prompt;
      // const model = task.model;
      const id = task.id;
      const generationId = task.generation_id;
      const promise = TaskPromiseMap.get(id);
      if (promise) {
        promise.resolve({ url: imageUrl, id: generationId });
      }
    } else if (
      task.status === GenerationStatus.FAILED ||
      task.status === GenerationStatus.FINISHED
    ) {
      const promise = TaskPromiseMap.get(task.id);
      if (promise) {
        promise.resolve({ error: 'Failed to generate image', id: task.id });
      }
    }

    if (
      task.status !== GenerationStatus.PROCESSING &&
      task.status !== GenerationStatus.PENDING
    ) {
      removeTaskId(task.id);
      if (pollingTaskIds.size === 0) {
        polling.cancel();
      }
    }
  }
};

export const addTaskId = (...taskIds: number[]) => {
  taskIds.forEach(taskId => {
    if (!taskId) {
      return;
    }
    pollingTaskIds.add(taskId);
  });
  polling.start(pollingImageTask);
};

const removeTaskId = (...taskIds: number[]) => {
  taskIds.forEach(taskId => {
    pollingTaskIds.delete(taskId);
  });
};

import { useAtomValue, useSetAtom } from 'jotai';
import { Modals, modalsAtom, modalsPayloadAtom } from '../state';

type ModalName = keyof Modals;
let name: ModalName | null = null;
let promise: Promise<any> | null = null;
export const useOpenModal = () => {
  const modals = useAtomValue(modalsAtom);
  const setPayload = useSetAtom(modalsPayloadAtom);
  // 保证一个tick之内多次提交打开modal的请求，modal只打开一次
  const submit = (signal: ModalName, payload?: any) => {
    if (name === signal) {
      return;
    }
    name = signal;
    setPayload(payload ?? null);
    if (!promise) {
      promise = new Promise(resolve => {
        resolve(null);
      }).then(() => {
        if (name && modals[name]) {
          modals[name]?.onOpen();
          name = null;
          promise = null;
        }
      });
    }
  };

  return {
    submit,
    modals,
  };
};

import { useAtom } from 'jotai';
import { useRef, useEffect } from 'react';
import { IDiffItem } from '../Components/InfCanva/types';
import {
  appStateAtom,
  comicPageSortingAtom,
  prevStepsAtom,
  redoStepsAtom,
  CNode,
} from '../state';
import { deepClone } from '../utilities';

export function useUpdateAppState() {
  const [, setAppState] = useAtom(appStateAtom);
  const [comicPageSorting, setComicPageSorting] = useAtom(comicPageSortingAtom);
  const [prevSteps, setPrevSteps] = useAtom(prevStepsAtom);
  const [redoSteps, setRedoSteps] = useAtom(redoStepsAtom);
  const comicPageSortingRef = useRef(comicPageSorting);

  const prevStepsRef = useRef(prevSteps);
  // const redoStepsRef = useRef(redoSteps);

  useEffect(() => {
    prevStepsRef.current = prevSteps;
  }, [prevSteps]);

  useEffect(() => {
    comicPageSortingRef.current = comicPageSorting;
  }, [comicPageSorting]);

  return (
    newAppState: Array<CNode>,
    newComicPageSorting?: Array<string>,
    diffItem?: IDiffItem,
  ) => {
    const _newAppState = deepClone(newAppState);
    const _prevSteps = deepClone(prevStepsRef.current);
    let _newComicPageSorting;

    setAppState(_newAppState);

    if (newComicPageSorting && newComicPageSorting.length) {
      _newComicPageSorting = deepClone(newComicPageSorting);
      setComicPageSorting(_newComicPageSorting);
    } else {
      _newComicPageSorting = deepClone(comicPageSortingRef.current);
    }

    setPrevSteps(_prevSteps.concat(diffItem!));
    setRedoSteps([]);
  };
}

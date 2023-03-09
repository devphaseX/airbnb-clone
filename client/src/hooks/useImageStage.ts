import { useRef, useEffect } from 'react';
import { createImageStager } from '../component/userPlace/createImageStager';
import { useSyncExternalStore } from 'react';
import { useState } from 'react';

const useImageStage = () => {
  const {
    fromExternalServerFetch,
    fromFileLoad,
    fromServerFetch,
    stageResults,
    onStageChange,
    unsubscribe: unsubscribeById,
    getStageState,
    stillActive,
    removeStage,
  } = useRef(createImageStager()).current;

  const [data, setData] = useState(stageResults);

  useEffect(() => {
    return onStageChange(function () {
      setData(stageResults());
    });
  }, []);
  console.log(data);
  return [
    data,
    {
      fromExternalServerFetch,
      fromFileLoad,
      fromServerFetch,
      unsubscribeById,
      getStageState,
      stillActive,
      removeStage,
    },
  ] as const;
};

export { useImageStage };

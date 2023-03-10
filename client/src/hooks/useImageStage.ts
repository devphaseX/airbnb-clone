import { useRef, useEffect } from 'react';
import { createImageStager } from '../component/userPlace/createImageStager';
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
    getRetryState,
  } = useRef(createImageStager()).current;

  const [data, setData] = useState(stageResults);

  useEffect(() => {
    return onStageChange(function () {
      setData(stageResults());
    });
  }, []);
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
      getRetryState,
    },
  ] as const;
};

export { useImageStage };

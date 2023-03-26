import { useCallback } from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';

const useUnmountStatus = () => {
  const hasMounted = useRef(false);

  useEffect(
    () => () => {
      hasMounted.current = true;
    },
    []
  );

  return useCallback(() => hasMounted.current, []);
};

export { useUnmountStatus };

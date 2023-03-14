import { useCallback } from 'react';
import { useState } from 'react';
const useForceUpdate = () => {
  const [_, setUpdateIndex] = useState(Math.random());

  return useCallback(() => {
    setUpdateIndex(Math.random() * Math.random());
  }, []);
};

export { useForceUpdate };

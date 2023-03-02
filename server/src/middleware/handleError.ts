import type { ErrorRequestHandler } from 'express';
import { getEnv } from '../server';

const globalErrorHandler: ErrorRequestHandler = (error, _, res, __) => {
  return res.status(500).json({
    message: 'Internal server error',
    ...(getEnv().NODE_ENV === 'development' && { error: error }),
  });
};

export { globalErrorHandler };

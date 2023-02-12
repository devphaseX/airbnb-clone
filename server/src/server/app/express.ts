import express from 'express';
import { mountConfig } from '../../middleware';

const createAppServer = () => {
  const app = express();
  mountConfig(app);
  return app;
};

export { createAppServer };

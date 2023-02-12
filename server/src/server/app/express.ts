import express from 'express';
import { mountConfig, mountRoute } from '../../middleware';

const createAppServer = () => {
  const app = express();
  mountConfig(app);
  mountRoute(app);
  return app;
};

export { createAppServer };

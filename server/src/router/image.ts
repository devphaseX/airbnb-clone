import express from 'express';
import {
  createImage,
  loadImage,
  getImage,
  removeUnTagImage,
} from '../controller/image/upload';
import { protectedAuthRoute } from '../controller/auth';

const imageRouter = express.Router();

imageRouter.post('/upload', protectedAuthRoute(), loadImage, createImage);
imageRouter.get('/:imageName', getImage);
imageRouter.post('/image/untag', protectedAuthRoute(), removeUnTagImage);

export { imageRouter };

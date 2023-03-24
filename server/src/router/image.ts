import express from 'express';
import {
  createImage,
  loadImage,
  getImage,
  removeUnTagImage,
} from '../controller/image/upload';
import { protectedAuthRoute } from '../controller/auth';

const imageRouter = express.Router();
//open access
imageRouter.get('/:imageName', getImage);

//protected access
imageRouter
  .use(protectedAuthRoute())
  .post('/', loadImage, createImage)
  .post('/untag', removeUnTagImage);

export { imageRouter };

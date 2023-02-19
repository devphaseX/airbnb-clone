import express from 'express';
import { createImage, loadImage, getImage } from '../controller/image/upload';

const imageRouter = express.Router();

imageRouter.post('/upload', loadImage, createImage);
imageRouter.get('/:imageName', getImage);

export { imageRouter };

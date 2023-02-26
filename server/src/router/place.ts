import express from 'express';
import { createAccomodation } from '../controller/place';

const placeRouter = express.Router();

placeRouter.post('/create', createAccomodation);

export { placeRouter };

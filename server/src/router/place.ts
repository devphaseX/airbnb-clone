import express from 'express';
import {
  createAccomodation,
  getPlace,
  getPlaces,
  updatePlace,
} from '../controller/place';
import { protectedAuthRoute } from '../controller/auth';

const placeRouter = express.Router().all('*', protectedAuthRoute());

placeRouter.get('/', getPlaces);
placeRouter.post('/create', createAccomodation);
const placeIdRoute = placeRouter.route('/:placeId');
placeIdRoute.get(getPlace);
placeIdRoute.put(updatePlace);

export { placeRouter };

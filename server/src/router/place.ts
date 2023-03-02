import express from 'express';
import {
  createAccomodation,
  getUserPlace,
  getUserPlaces,
  updateUserPlace,
} from '../controller/place';
import { protectedAuthRoute } from '../controller/auth';

const placeRouter = express.Router();

const protectPlaceRouter = placeRouter.use(protectedAuthRoute());

protectPlaceRouter.get('/user', getUserPlaces);
protectPlaceRouter
  .route('/user/:placeId')
  .get(getUserPlace)
  .put(updateUserPlace);
protectPlaceRouter.post('/user/create', createAccomodation);

export { placeRouter };

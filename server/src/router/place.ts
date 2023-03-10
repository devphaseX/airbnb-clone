import express from 'express';
import {
  createAccomodation,
  getPlace,
  getPlaces,
  getUserPlace,
  getUserPlaces,
  updateUserPlace,
} from '../controller/place';
import { protectedAuthRoute } from '../controller/auth';

const placeRouter = express.Router();

//general unprotected route
placeRouter.get('/', getPlaces);

placeRouter.get('/item/:placeId', getPlace);

//protected route for auth user
const protectPlaceRouter = placeRouter.use(protectedAuthRoute());

protectPlaceRouter.get('/user', getUserPlaces);
protectPlaceRouter
  .route('/user/:placeId')
  .get(getUserPlace)
  .put(updateUserPlace);
protectPlaceRouter.post('/user/create', createAccomodation);

export { placeRouter };

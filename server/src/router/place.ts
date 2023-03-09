import express from 'express';
import {
  createAccomodation,
  getPlaces,
  getUserPlace,
  getUserPlaces,
  updateUserPlace,
} from '../controller/place';
import { protectedAuthRoute } from '../controller/auth';

const placeRouter = express.Router();

//general unprotected route
placeRouter.get('/', getPlaces);

//protected route for auth user
const protectPlaceRouter = placeRouter.use(protectedAuthRoute());

protectPlaceRouter.get('/user', getUserPlaces);
protectPlaceRouter
  .route('/user/:placeId')
  .get(getUserPlace)
  .put(updateUserPlace);
protectPlaceRouter.post('/user/create', createAccomodation);

export { placeRouter };

import express from 'express';
import { protectedAuthRoute } from '../controller/auth';
import { createBooking, getBookings } from '../controller/booking';

const bookingRouter = express.Router();

bookingRouter
  .use(protectedAuthRoute())
  .route('/')
  .post(createBooking)
  .get(getBookings);

export { bookingRouter };

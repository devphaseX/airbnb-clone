import { RequestHandler } from 'express';
import { Booking, BookingDoc, Place } from '../../model';
import { bookingSchema } from '../../model/booking/booking.schema.zod';

type CreateBookingHandler = RequestHandler<any, any, BookingDoc>;

const createBooking: CreateBookingHandler = async (req, res, next) => {
  try {
    const bookingData = await bookingSchema.parseAsync(req.body);
    const product = await Place.findById(bookingData.placeId);
    if (!product) {
      return res.status(404);
    }

    if (
      product.checkin! >= bookingData.checkIn.getTime() &&
      product.checkout! <= bookingData.checkOut.getTime()
    ) {
      return res.status(401).json({});
    }

    const booking = await Booking.create({
      userId: req.user!._id,
      ...bookingData,
    });

    return res.status(201).json(booking);
  } catch (e) {
    next(e);
  }
};

type GetBookingsHandler = RequestHandler;

const getBookings: GetBookingsHandler = async (req, res, next) => {
  try {
    const bookings = Booking.find({ userId: req.user._id });
    return res.status(200).json(bookings);
  } catch (e) {
    next(e);
  }
};

export { createBooking, getBookings };

import type { BookingDocRaw } from './booking.model';
import { z } from 'zod';

const bookingSchema = z.object({
  placeId: z.string(),
  checkIn: z.date({ coerce: true }),
  checkOut: z.date({ coerce: true }),
  guests: z.number({ coerce: true }).min(1),
  price: z.number({ coerce: true }),
} satisfies Record<Exclude<keyof BookingDocRaw, DocumentCreatedField | 'userId'>, any>);

type BookingDoc = typeof bookingSchema._input;
export { bookingSchema, BookingDoc };

export const EXCHANGES = {
  BOOKING: 'booking.exchange',
  PAYMENT: 'payment.exchange',
  DRIVER: 'driver.exchange',
  USER: 'user.exchange',
  NOTIFICATION: 'notification.exchange',
} as const;

export const ROUTING_KEYS = {
  BOOKING_CREATED: 'booking.created',
  BOOKING_CANCELLED: 'booking.cancelled',
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed',

  RIDE_ACCEPTED: 'realtime-booking.ride.accepted',
  RESPONSE_RIDE_REQUEST: 'realtime-booking.ride.request.response',
  UPDATE_DRIVER_RIDE_COUNT: "realtime-driver.ride.status.update",
  
  NOTIFY_BOOK_RIDE_DRIVER: 'booking-realtime.booked.ride',
  NOTIFY_RIDE_COMPLETED: 'booking-realtime.ride.completed',

  NOTIFY_DOCUMENT_EXPIRE:'driver-realtime.document.expire',

  USER_WALLET_CREATE: 'user-payment.wallet.create',
  USER_ADDED_REWARD_AMOUNT: 'user-payment.added.reward.amount',
} as const;

export const QUEUES = {
  BOOKING_QUEUE: 'booking.queue',
  PAYMENT_QUEUE: 'payment.queue',
  DRIVER_QUEUE: 'driver.queue',
  REALTIME_QUEUE: 'realtime.queue',
} as const;

// DLQ and retry conventions
export const DLQ_SUFFIX = '.dlq';
export const RETRY_SUFFIX = '.retry';

// Helper to auto-generate DLQ/retry queue names
export function buildQueueNames(base: string) {
  return {
    main: base,
    retry: `${base}${RETRY_SUFFIX}`,
    dlq: `${base}${DLQ_SUFFIX}`,
  };
}

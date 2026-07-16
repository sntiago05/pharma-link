import { confirmDelivery as confirmDeliveryService } from '../services/reservation.service.js';
import { sendSuccess } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

/** POST /api/deliveries/:reservationId — pharmacy confirms handover. */
export const confirmDelivery = asyncHandler(async (req, res) => {
  const delivery = await confirmDeliveryService({
    reservationId: req.params.reservationId,
    deliveredBy: req.auth.sub,
  });

  res.locals.auditRecordId = delivery.id;
  return sendSuccess(res, { status: 201, message: 'Delivery confirmed.', data: delivery });
});

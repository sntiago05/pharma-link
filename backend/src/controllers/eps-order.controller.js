import { createEpsOrder, listEpsOrders } from '../services/eps-order.service.js';
import { sendSuccess } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

/** GET /api/eps/:epsId/orders */
export const listOrders = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Orders retrieved.',
    data: await listEpsOrders({
      epsId: Number(req.params.epsId),
      status: req.query.status,
      search: req.query.search,
      limit: req.query.limit ?? 50,
      offset: req.query.offset ?? 0,
    }),
  }),
);

/** POST /api/eps/:epsId/orders */
export const createOrder = asyncHandler(async (req, res) => {
  const order = await createEpsOrder({
    // From the path, which requireEpsAccess has already checked against the
    // operator's link — never from the body.
    epsId: Number(req.params.epsId),
    orderNumber: req.body.orderNumber,
    patientDocument: req.body.patientDocument,
    patientFullName: req.body.patientFullName,
    patientEmail: req.body.patientEmail,
    patientPhone: req.body.patientPhone,
    issueDate: req.body.issueDate,
    expirationDate: req.body.expirationDate,
    details: req.body.details,
  });

  res.locals.auditRecordId = order.id;
  return sendSuccess(res, { status: 201, message: 'Order created.', data: order });
});

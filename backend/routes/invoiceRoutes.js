const express = require('express');
const { 
  createInvoice, 
  getInvoices, 
  getInvoice,
  updateInvoice,
  requestModification,
  deleteInvoice,
  resolveModification
} = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getInvoices)
  .post(createInvoice);

router.route('/:id')
  .get(getInvoice)
  .put(authorize('admin'), updateInvoice)
  .delete(authorize('admin'), deleteInvoice);

router.route('/:id/request-modification')
  .put(requestModification); // Staff can request edit/delete

router.route('/:id/resolve-modification')
  .put(authorize('admin'), resolveModification); // Admin can mark request as resolved/rejected

module.exports = router;

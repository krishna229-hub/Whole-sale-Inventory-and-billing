const express = require('express');
const { getCustomers, getCustomerDetails } = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getCustomers);

router.route('/:id')
  .get(getCustomerDetails);

module.exports = router;

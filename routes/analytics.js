const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const protegerRuta = require('../middleware/auth');

router.post('/track', analyticsController.track);
router.get('/detalle', protegerRuta, analyticsController.verDetalle);

module.exports = router;

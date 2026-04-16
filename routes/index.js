const express = require('express');
const router = express.Router();
const protegerRuta = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

router.use(protegerRuta);

router.get('/', dashboardController.mostrarDashboard);

module.exports = router;
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const protegerRuta = require('../middleware/auth');

router.post('/track', analyticsController.track);
router.get('/detalle', protegerRuta, analyticsController.verDetalle);
router.get('/visitante/:id', protegerRuta, analyticsController.verVisitante);
router.get('/exportar', protegerRuta, analyticsController.exportarCSV);
router.get('/social-proof', analyticsController.socialProof);

module.exports = router;

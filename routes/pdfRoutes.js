const express = require('express');
const router = express.Router();
// const Vehicle = require('../models/Vehicle');
const { generatePdfFromHtml } = require('../services/pdfService');

router.get('/generate-pdf/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const pdfBuffer = await generatePdfFromHtml(vehicle);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=vehicle_report_${vehicle._id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
  }
});

module.exports = router;

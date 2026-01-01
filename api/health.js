/**
 * Precision Prices - Health Check Endpoint
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

export default async function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'Precision Prices backend is running'
  });
}

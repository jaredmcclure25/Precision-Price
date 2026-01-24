/**
 * PrecisionPrices Cloud Functions
 */

const admin = require('firebase-admin');

admin.initializeApp();

// Export functions
exports.sendListingReminders = require('./notifications').sendListingReminders;
exports.aggregateMarketData = require('./aggregation').aggregateMarketData;

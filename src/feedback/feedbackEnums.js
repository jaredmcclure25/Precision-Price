/**
 * Precision Prices - Feedback System Enums
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

export const FeedbackPurpose = {
  PRICE_ACCURACY: "price_accuracy",
  TIME_TO_SELL: "time_to_sell",
  NEGOTIATION_FAIRNESS: "negotiation_fairness",
  GHOSTING: "ghosting",
  UX_USABILITY: "ux_usability"
};

export const TransactionStage = {
  PRE_LISTING: "pre_listing",
  ACTIVE_LISTING: "active_listing",
  SOLD: "sold",
  NOT_SOLD: "not_sold"
};

export const FeedbackEffort = {
  MICRO: "micro",
  SHORT: "short",
  LONG: "long"
};

export const UserSegment = {
  CASUAL_SELLER: "casual_seller",
  MOVER: "mover",
  QUICK_CASH: "quick_cash",
  RESELLER: "reseller",
  BUYER: "buyer"
};

// Shared constants and labels for seller oversight, disputes and buyer confirmation.

// Part 3 §6.4: how long after delivery a buyer can confirm or report a problem.
export const CONFIRM_WINDOW_DAYS = 7;

// Sellers page: cancel rate at or above this (0 to 1) is shown as a warning sign.
export const HIGH_CANCEL_RATE = 0.25;

export const REPORT_REASONS = [
  { value: "wrong_item", label: "I received the wrong item" },
  { value: "damaged", label: "The item arrived damaged" },
  { value: "not_received", label: "I never received it" },
  { value: "other", label: "Something else" },
];

export const REASON_LABEL = {
  wrong_item: "Wrong item",
  damaged: "Damaged",
  not_received: "Not received",
  other: "Other",
};

export const DISPUTE_STATUS_LABEL = {
  open: "Open",
  resolved_refund: "Refunded",
  resolved_no_action: "No action",
  closed: "Closed",
};

export const DISPUTE_TABS = [
  { value: "open", label: "Open" },
  { value: "resolved_refund", label: "Refunded" },
  { value: "resolved_no_action", label: "No action" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All" },
];
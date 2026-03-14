const { createMetric } = require('./otelBuilder');

let pizzasSold = 0;
let creationFailures = 0;
let totalRevenue = 0;

function pizzaPurchased(amount) { pizzasSold++; totalRevenue += amount || 0; }
function purchaseFailed()       { creationFailures++; }

function purchaseMetrics() {
  return [
    createMetric('pizza_sold_total',             pizzasSold,       '1',   'sum', 'asInt',    {}),
    createMetric('pizza_creation_failures_total', creationFailures, '1',   'sum', 'asInt',    {}),
    createMetric('pizza_revenue_total',           totalRevenue,     'BC', 'sum', 'asDouble', {}),
  ];
}

module.exports = { pizzaPurchased, purchaseFailed, purchaseMetrics };
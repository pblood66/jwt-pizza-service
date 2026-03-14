const { createMetric } = require("./otelBuilder");

let pizzasSold = 0;
let creationFailures = 0;
let totalRevenue = 0;
let pizzaCreationLatencies = [];

function pizzaPurchased(amount) {
  pizzasSold++;
  totalRevenue += amount || 0;
}
function purchaseFailed() {
  creationFailures++;
}
function recordPizzaCreationLatency(ms) {
  pizzaCreationLatencies.push(ms);
}

function purchaseMetrics() {
  const metrics = [
    createMetric("pizza_sold_total", pizzasSold, "1", "sum", "asInt", {}),
    createMetric(
      "pizza_creation_failures_total",
      creationFailures,
      "1",
      "sum",
      "asInt",
      {},
    ),
    createMetric(
      "pizza_revenue_total",
      totalRevenue,
      "USD",
      "sum",
      "asDouble",
      {},
    ),
  ];
  if (pizzaCreationLatencies.length > 0) {
    const avg =
      pizzaCreationLatencies.reduce((a, b) => a + b, 0) /
      pizzaCreationLatencies.length;
    metrics.push(
      createMetric(
        "pizza_creation_latency_ms",
        avg,
        "ms",
        "gauge",
        "asDouble",
        {},
      ),
    );
    pizzaCreationLatencies = [];
  }
  return metrics;
}

module.exports = {
  pizzaPurchased,
  purchaseFailed,
  recordPizzaCreationLatency,
  purchaseMetrics,
};

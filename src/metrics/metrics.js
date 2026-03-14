const { systemMetrics } = require("./systemMetrics");
const { httpMetrics } = require("./httpMetrics");
const { OtelMetricBuilder } = require("./otelBuilder");
const { userMetrics } = require("./userMetrics");
const { authMetrics } = require("./authMetrics");
const { purchaseMetrics } = require("./purchaseMetrics");

function sendMetricsPeriodically(period) {
  setInterval(() => {
    try {
      new OtelMetricBuilder()
        .add(systemMetrics)
        .add(httpMetrics)
        .add(userMetrics)
        .add(authMetrics)
        .add(purchaseMetrics)
        .sendToGrafana();
    } catch (error) {
      console.error("Error sending metrics", error);
    }
  }, period);
}

module.exports = { sendMetricsPeriodically };

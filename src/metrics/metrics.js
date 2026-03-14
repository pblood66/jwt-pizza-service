const { systemMetrics } = require("./systemMetrics");
const { httpMetrics } = require("./httpMetrics");
const { OtelMetricBuilder } = require("./otelBuilder");
const { userMetrics } = require("./userMetrics");
const { authMetrics } = require("./authMetrics");

function sendMetricsPeriodically(period) {
  setInterval(() => {
    try {
      new OtelMetricBuilder().add(systemMetrics).add(httpMetrics).add(userMetrics).add(authMetrics).sendToGrafana();
    } catch (error) {
      console.error("Error sending metrics", error);
    }
  }, period);
}

module.exports = { sendMetricsPeriodically };

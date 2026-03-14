const { systemMetrics } = require("./systemMetrics");
const { httpMetrics } = require("./httpMetrics");
const { OtelMetricBuilder } = require("./otelBuilder");

function sendMetricsPeriodically(period) {
  setInterval(() => {
    try {
      new OtelMetricBuilder().add(systemMetrics).add(httpMetrics).sendToGrafana();
    } catch (error) {
      console.error("Error sending metrics", error);
    }
  }, period);
}

module.exports = { sendMetricsPeriodically };

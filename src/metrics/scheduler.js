const { systemMetrics } = require("./systemMetrics");
const { OtelMetricBuilder } = require("./otelBuilder");

function sendMetricsPeriodically(period) {
  setInterval(() => {
    try {
      new OtelMetricBuilder().add(systemMetrics).sendToGrafana();
    } catch (error) {
      console.error("Error sending metrics", error);
    }
  }, period);
}

module.exports = { sendMetricsPeriodically };

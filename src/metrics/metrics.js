const { sendMetricsPeriodically } = require("./scheduler");


function requestTracker(req, res, next) {
  next();
}

sendMetricsPeriodically(10000);

module.exports = { requestTracker };
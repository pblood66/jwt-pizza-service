const { createMetric } = require('./otelBuilder');

const httpRequests = {};
const allLatencies = []; 

function requestTracker(req, res, next) {
  const method = req.method;
  httpRequests[method] = (httpRequests[method] || 0) + 1;

  const start = Date.now();
  res.on('finish', () => {
    allLatencies.push(Date.now() - start);
  });

  next();
}

function httpMetrics() {
  const metrics = [];

  const total = Object.values(httpRequests).reduce((a, b) => a + b, 0);
  metrics.push(createMetric('http_requests_total', total, '1', 'sum', 'asInt', {}));

  ['GET', 'POST', 'PUT', 'DELETE'].forEach((method) => {
    metrics.push(createMetric('http_requests_by_method', httpRequests[method] || 0, '1', 'sum', 'asInt', { method }));
  });

  if (allLatencies.length > 0) {
    const avg = allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length;
    metrics.push(createMetric('http_latency_ms', avg, 'ms', 'gauge', 'asDouble', {}));
  }

  return metrics;
}

module.exports = { requestTracker, httpMetrics };
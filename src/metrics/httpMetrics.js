const { createMetric } = require('./otelBuilder')

const httpRequests = {}

function requestTracker(req, res, next) {
    const method = req.method;
    httpRequests[method] = (httpRequests[method] || 0) + 1;
    next();
}

function httpMetrics() {
    const metrics = [];

    const total = Object.values(httpRequests).reduce((a, b) => a + b, 0);

    metrics.push(createMetric('http_requests_total', total, '1', 'sum', 'asInt', {}));
  
    ['GET', 'POST', 'PUT', 'DELETE'].forEach((method) => {
        metrics.push(createMetric('http_requests_by_method', httpRequests[method] || 0, '1', 'sum', 'asInt', { method }));
    });
    return metrics;
}

module.exports = { requestTracker, httpMetrics };
const httpMock = require('node-mocks-http');

jest.mock('../config', () => ({
  metrics: {
    source: 'test-source',
    endpointUrl: 'https://mock-grafana.example.com',
    accountId: 'test-account',
    apiKey: 'test-key',
  },
}));

global.fetch = jest.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
);

const { requestTracker, httpMetrics } = require('../metrics/httpMetrics');
const { userLoggedIn, userLoggedOut, userMetrics } = require('../metrics/userMetrics');
const { loginSucceeded, loginFailed, authMetrics } = require('../metrics/authMetrics');
const { pizzaPurchased, purchaseFailed, recordPizzaCreationLatency, purchaseMetrics } = require('../metrics/purchaseMetrics');
const { createMetric } = require('../metrics/otelBuilder');

describe('httpMetrics', () => {
  test('requestTracker increments method count', () => {
    const req = httpMock.createRequest({ method: 'GET', path: '/api/order/menu' });
    const res = httpMock.createResponse();
    requestTracker(req, res, () => {});

    const metrics = httpMetrics();
    const byMethod = metrics.find((m) => m.name === 'http_requests_by_method');
    expect(byMethod).toBeDefined();
  });

  test('requestTracker tracks total requests', () => {
    const req = httpMock.createRequest({ method: 'POST', path: '/api/order' });
    const res = httpMock.createResponse();
    requestTracker(req, res, () => {});

    const metrics = httpMetrics();
    const total = metrics.find((m) => m.name === 'http_requests_total');
    expect(total.gauge?.dataPoints[0]?.asInt ?? total.sum?.dataPoints[0]?.asInt).toBeGreaterThan(0);
  });
});

describe('userMetrics', () => {
  test('userLoggedIn increments active users', () => {
    userLoggedIn();
    const metrics = userMetrics();
    const active = metrics.find((m) => m.name === 'users_active');
    expect(active.gauge.dataPoints[0].asInt).toBeGreaterThan(0);
  });

  test('userLoggedOut decrements active users', () => {
    userLoggedIn();
    const before = userMetrics().find((m) => m.name === 'users_active').gauge.dataPoints[0].asInt;
    userLoggedOut();
    const after = userMetrics().find((m) => m.name === 'users_active').gauge.dataPoints[0].asInt;
    expect(after).toBe(before - 1);
  });

  test('active users never goes below 0', () => {
    // Force it to 0 then try to decrement
    for (let i = 0; i < 100; i++) userLoggedOut();
    const metrics = userMetrics();
    const active = metrics.find((m) => m.name === 'users_active');
    expect(active.gauge.dataPoints[0].asInt).toBe(0);
  });
});

describe('authMetrics', () => {
  test('loginSucceeded increments success counter', () => {
    loginSucceeded();
    const metrics = authMetrics();
    const success = metrics.find((m) => m.name === 'auth_success_total');
    expect(success.sum.dataPoints[0].asInt).toBeGreaterThan(0);
  });

  test('loginFailed increments failure counter', () => {
    loginFailed();
    const metrics = authMetrics();
    const failed = metrics.find((m) => m.name === 'auth_failure_total');
    expect(failed.sum.dataPoints[0].asInt).toBeGreaterThan(0);
  });

  test('authMetrics returns both success and failure metrics', () => {
    const metrics = authMetrics();
    expect(metrics.find((m) => m.name === 'auth_success_total')).toBeDefined();
    expect(metrics.find((m) => m.name === 'auth_failure_total')).toBeDefined();
  });
});

describe('purchaseMetrics', () => {
  test('pizzaPurchased increments sold count and revenue', () => {
    pizzaPurchased(0.05);
    const metrics = purchaseMetrics();
    const sold = metrics.find((m) => m.name === 'pizza_sold_total');
    const revenue = metrics.find((m) => m.name === 'pizza_revenue_total');
    expect(sold.sum.dataPoints[0].asInt).toBeGreaterThan(0);
    expect(revenue.sum.dataPoints[0].asDouble).toBeGreaterThan(0);
  });

  test('purchaseFailed increments failure count', () => {
    purchaseFailed();
    const metrics = purchaseMetrics();
    const failures = metrics.find((m) => m.name === 'pizza_creation_failures_total');
    expect(failures.sum.dataPoints[0].asInt).toBeGreaterThan(0);
  });

  test('recordPizzaCreationLatency averages latencies', () => {
    recordPizzaCreationLatency(100);
    recordPizzaCreationLatency(200);
    const metrics = purchaseMetrics();
    const latency = metrics.find((m) => m.name === 'pizza_creation_latency_ms');
    expect(latency).toBeDefined();
    expect(latency.gauge.dataPoints[0].asDouble).toBe(150);
  });

  test('pizza creation latency resets after each metrics call', () => {
    recordPizzaCreationLatency(500);
    purchaseMetrics(); // first call consumes the latency
    const metrics = purchaseMetrics(); // second call should have no latency metric
    const latency = metrics.find((m) => m.name === 'pizza_creation_latency_ms');
    expect(latency).toBeUndefined();
  });
});

describe('createMetric', () => {
  test('creates a gauge metric with correct structure', () => {
    const metric = createMetric('test_metric', 42.5, '%', 'gauge', 'asDouble', {});
    expect(metric.name).toBe('test_metric');
    expect(metric.unit).toBe('%');
    expect(metric.gauge.dataPoints[0].asDouble).toBe(42.5);
  });

  test('creates a sum metric with aggregation temporality', () => {
    const metric = createMetric('test_counter', 10, '1', 'sum', 'asInt', {});
    expect(metric.sum.aggregationTemporality).toBe('AGGREGATION_TEMPORALITY_CUMULATIVE');
    expect(metric.sum.isMonotonic).toBe(true);
  });

  test('includes source attribute from config', () => {
    const metric = createMetric('test_metric', 1, '1', 'gauge', 'asInt', {});
    const sourceAttr = metric.gauge.dataPoints[0].attributes.find((a) => a.key === 'source');
    expect(sourceAttr.value.stringValue).toBe('test-source');
  });

  test('includes custom attributes', () => {
    const metric = createMetric('test_metric', 1, '1', 'gauge', 'asInt', { method: 'GET' });
    const methodAttr = metric.gauge.dataPoints[0].attributes.find((a) => a.key === 'method');
    expect(methodAttr.value.stringValue).toBe('GET');
  });
});
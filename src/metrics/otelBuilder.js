const config = require('../config');

function createMetric(metricName, metricValue, metricUnit, metricType, valueType, attributes) {
  attributes = { ...attributes, source: config.metrics.source };
  const metric = {
    name: metricName,
    unit: metricUnit,
    [metricType]: {
      dataPoints: [
        {
          [valueType]: metricValue,
          timeUnixNano: Date.now() * 1000000,
          attributes: [],
        },
      ],
    },
  };
  Object.keys(attributes).forEach((key) => {
    metric[metricType].dataPoints[0].attributes.push({
      key: key,
      value: { stringValue: attributes[key] },
    });
  });
  return metric;
}

class OtelMetricBuilder {
  constructor() { this.metrics = []; }
 
  add(metricsFn) {
    const results = metricsFn();
    if (Array.isArray(results)) this.metrics.push(...results);
    return this;
  }
 
  sendToGrafana() {
    const body = {
      resourceMetrics: [{ scopeMetrics: [{ metrics: this.metrics }] }],
    };
    fetch(config.metrics.endpointUrl, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${config.metrics.accountId}:${config.metrics.apiKey}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP status: ${res.status}`);
        console.log('Metrics sent successfully');
      })
      .catch((err) => console.error('Error pushing metrics:', err));
  }
}

module.exports = { createMetric, OtelMetricBuilder };
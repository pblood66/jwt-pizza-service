const { createMetric } = require('./otelBuilder');

let successfulLogins = 0;
let failedLogins = 0;

function loginSucceeded() { successfulLogins++; }
function loginFailed()    { failedLogins++; }

function authMetrics() {
  return [
    createMetric('auth_success_total', successfulLogins, '1', 'sum', 'asInt', {}),
    createMetric('auth_failure_total', failedLogins,     '1', 'sum', 'asInt', {}),
  ];
}

module.exports = { loginSucceeded, loginFailed, authMetrics };
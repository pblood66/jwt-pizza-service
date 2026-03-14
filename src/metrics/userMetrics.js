const { createMetric } = require('./otelBuilder');

let activeUsers = 0;

function userLoggedIn()  { activeUsers++; }
function userLoggedOut() { activeUsers = Math.max(0, activeUsers - 1); }

function userMetrics() {
  return [
    createMetric('users_active', activeUsers, '1', 'gauge', 'asInt', {}),
  ];
}

module.exports = { userLoggedIn, userLoggedOut, userMetrics };
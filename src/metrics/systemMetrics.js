const os = require('os');
const { createMetric } = require('./otelBuilder');

function getCpuUsagePercentage() {
  const cpus = os.cpus();
  let totalIdle = 0, totalTick = 0;

  cpus.forEach((cpu) => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });

  return ((1 - totalIdle / totalTick) * 100).toFixed(2);
}

function getMemoryUsagePercentage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  return memoryUsage.toFixed(2);
}

function systemMetrics() {
  return [
    createMetric('system_cpu_percent', getCpuUsagePercentage(), '%', 'gauge', 'asDouble', {}),
    createMetric('system_memory_percent', getMemoryUsagePercentage(), '%', 'gauge', 'asDouble', {}),
    createMetric('system_uptime_seconds', os.uptime(), 's', 'gauge', 'asDouble', {}),
  ];
}

module.exports = { systemMetrics }
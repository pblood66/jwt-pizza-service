const app = require('./service.js');
const {sendMetricsPeriodically} = require('./metrics/metrics.js');

const port = process.argv[2] || 3000;

sendMetricsPeriodically(10000);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

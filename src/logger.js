const config = require('./config');

class Logger {
  // Log levels
  static levels = {
    info: 'info',
    warn: 'warn',
    error: 'error',
  };

  httpLogger = (req, res, next) => {
    const start = Date.now();

    const originalJson = res.json.bind(res);
    let responseBody;
    res.json = (body) => {
      responseBody = body;
      return originalJson(body);
    };

    res.on('finish', () => {
      const level = res.statusCode >= 500 ? Logger.levels.error
                  : res.statusCode >= 400 ? Logger.levels.warn
                  : Logger.levels.info;

      this.log(level, 'http', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
        authorized: !!req.headers.authorization,
        requestBody: this.sanitize(req.body),
        responseBody: this.sanitize(responseBody),
      });
    });

    next();
  };

  // Log a database query
  dbLogger(query, params = []) {
    this.log(Logger.levels.info, 'database', {
      query: this.sanitize(query),
      
      paramCount: params.length,
    });
  }

  // Log a call to the pizza factory and its response
  factoryLogger(requestBody, responseBody) {
    this.log(Logger.levels.info, 'factory', {
      request: this.sanitize(requestBody),
      response: this.sanitize(responseBody),
    });
  }

  // Log an unhandled exception
  exceptionLogger(err) {
    this.log(Logger.levels.error, 'exception', {
      message: err?.message ?? String(err),
      stack: err?.stack,
    });
  }

  // General-purpose logger
  log(level, type, data) {
    const labels = {
      component: 'jwt-pizza-service',
      level,
      type,
      source: config.logs.source,
    };

    const values = [
      [
        // Loki expects a nanosecond Unix timestamp as a string
        String(Date.now() * 1_000_000),
        JSON.stringify({ level, type, ...data }),
      ],
    ];

    this.sendLogToGrafana({ streams: [{ stream: labels, values }] });
  }

  sanitize(data) {
    if (!data) return data;

    let copy;
    try {
      copy = JSON.parse(JSON.stringify(data));
    } catch {
      return String(data).replace(/(password|token|authorization|apikey)[^&]*/gi, '$1=***');
    }

    const SENSITIVE = new Set([
      'password', 'token', 'authorization', 'apiKey', 'api_key',
      'secret', 'creditCard', 'credit_card', 'ssn',
    ]);

    const scrub = (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj;
      for (const key of Object.keys(obj)) {
        if (SENSITIVE.has(key.toLowerCase()) || SENSITIVE.has(key)) {
          obj[key] = '***';
        } else if (typeof obj[key] === 'object') {
          scrub(obj[key]);
        }
      }
      return obj;
    };

    return scrub(copy);
  }

  sendLogToGrafana(event) {
    const body = JSON.stringify(event);
    fetch(config.logs.endpointUrl, {
      method: 'post',
      body,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.logs.accountId}:${config.logs.apiKey}`,
      },
    }).then((res) => {
      if (!res.ok) {
        res.text().then((t) =>
          console.error(`Failed to send log to Grafana (${res.status}):`, t)
        );
      }
    }).catch((err) => {
      console.error('Logger network error:', err.message);
    });
  }
}

// Export a single shared instance
module.exports = new Logger();
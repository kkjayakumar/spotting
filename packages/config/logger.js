const LEVELS = {
  debug: "DEBUG",
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
};

function sanitizeValue(value) {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  return value;
}

function writeLog(level, service, message, context) {
  const payload = {
    timestamp: new Date().toISOString(),
    level: LEVELS[level],
    service,
    message,
    ...(context ?? {}),
  };

  const line = JSON.stringify(payload, (_key, value) => sanitizeValue(value));
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

export function createLogger(service) {
  return {
    debug(message, context) {
      writeLog("debug", service, message, context);
    },
    info(message, context) {
      writeLog("info", service, message, context);
    },
    warn(message, context) {
      writeLog("warn", service, message, context);
    },
    error(message, context) {
      writeLog("error", service, message, context);
    },
  };
}

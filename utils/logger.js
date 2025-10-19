function logger(msg, level = 'log') {
  const ts = new Date().toISOString();
  if (level === 'error') console.error(`[${ts}] ERROR:`, msg);
  else if (level === 'warn') console.warn(`[${ts}] WARN:`, msg);
  else console.log(`[${ts}] LOG:`, msg);
}

module.exports = logger;
const chalk = require("chalk");
const moment = require("moment");

const log = (content, type = "log") => {
  const timestamp = `[${moment().format("YYYY-MM-DD HH:mm:ss")}]:`;
  switch (type) {
    case "log":
      return console.log(
        `${timestamp} ${chalk.bgBlue(type.toUpperCase())} ${content} `
      );
    case "warn":
      return console.log(
        `${timestamp} ${chalk.black.bgYellow(type.toUpperCase())} ${content} `
      );
    case "error":
      return console.log(
        `${timestamp} ${chalk.bgRed(type.toUpperCase())} ${content} `
      );
    case "debug":
      return console.log(
        `${timestamp} ${chalk.green(type.toUpperCase())} ${content} `
      );
    case "cmd":
      return console.log(
        `${timestamp} ${chalk.black.bgWhite(type.toUpperCase())} ${content}`
      );
    case "ready":
      return console.log(
        `${timestamp} ${chalk.black.bgGreen(type.toUpperCase())} ${content}`
      );
    case "event":
      return console.log(
        `${timestamp} ${chalk.black.bgMagenta(type.toUpperCase())} ${content}`
      );
    default:
      throw new TypeError(
        "Logger type must be one of log, warn, error, debug, cmd, event, or ready."
      );
  }
};

log.log = (content) => log(content, "log");
log.info = (content) => log(content, "log");
log.warn = (content) => log(content, "warn");
log.error = (content) => log(content, "error");
log.debug = (content) => log(content, "debug");
log.cmd = (content) => log(content, "cmd");
log.event = (content) => log(content, "event");
log.ready = (content) => log(content, "ready");

module.exports = log;

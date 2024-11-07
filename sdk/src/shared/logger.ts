// @ts-nocheck
import colors from "colors";

export class Logger {
  constructor(public name: string) {}

  log(...args: unknown[]) {
    console.log(`[${this.name}]`, ...args);
  }

  debug = (...args: unknown[]) =>
    console.log("[DEBUG]".grey, `[${this.name}]`, ...args);

  info = (...args: unknown[]) =>
    console.log("[INFO]".cyan, `[${this.name}]`, ...args);

  json = (...args: unknown[]) =>
    console.log("[INFO]".yellow, `[${this.name}]`, ...args);

  error = (...args: unknown[]) =>
    console.error("[ERROR]".red, `[${this.name}]`, ...args);

  success = (...args: unknown[]) =>
    console.log("[SUCCESS]".green.padEnd(10, " "), `[${this.name}]`, ...args);

  failure = (...args: unknown[]) =>
    console.log("[FAILURE]".red.padEnd(10, " "), `[${this.name}]`, ...args);

  notice = (...args: unknown[]) =>
    console.log("[NOTICE]".yellow.padEnd(10, " "), `[${this.name}]`, ...args);
}

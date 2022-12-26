export class Logger {
  fileName = "";
  isEnabled = true;

  constructor(file: string) {
    this.fileName = `${file} >>`;
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  logConsole(...args: any[]): void {
    if (!this.isEnabled) {
      return;
    }
    console.log(this.fileName, ...args);
  }

  logWarn(...args: any[]): void {
    if (!this.isEnabled) {
      return;
    }
    console.warn(this.fileName, ...args);
  }

  logError(...args: any[]): void {
    if (!this.isEnabled) {
      return;
    }
    console.error(this.fileName, ...args);
  }

  logInfo(...args: any[]): void {
    if (!this.isEnabled) {
      return;
    }
    console.info(this.fileName, ...args);
  }
}

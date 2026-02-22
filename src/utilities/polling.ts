export class Polling {
  timeout: number;
  private timeoutId: NodeJS.Timeout | null = null;
  private task: (() => void | Promise<void>) | null = null;
  private isRunning: boolean = false;

  constructor(timeout: number) {
    this.timeout = timeout;
  }

  start(task: () => void | Promise<void>): void {
    if (this.isRunning) {
      return;
    }

    this.task = task;
    this.isRunning = true;
    this.executeTask();
  }

  private async executeTask(): Promise<void> {
    if (!this.isRunning || !this.task) {
      return;
    }

    try {
      await this.task();
    } catch (error) {
      console.error('Polling task error:', error);
    }

    if (this.isRunning) {
      this.timeoutId = setTimeout(() => {
        this.executeTask();
      }, this.timeout);
    }
  }

  cancel(): void {
    this.isRunning = false;
    this.task = null;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  isPolling(): boolean {
    return this.isRunning;
  }
}

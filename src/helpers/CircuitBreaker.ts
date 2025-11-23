export default class CircuitBreaker {
  private failures = 0;
  private state: "closed" | "open" | "half-open" = "closed";
  private lastFailureTime = 0;
  private threshold: number;
  private timeout: number;
  private action: (...args: any[]) => Promise<any>;

  constructor(
    action: (...args: any[]) => Promise<any>,
    threshold: number,
    timeout: number
  ) {
    this.action = action;
    this.threshold = threshold;
    this.timeout = timeout;
  }

  async fire(...args: any[]): Promise<any> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = "half-open";
      } else {
        throw new Error("Circuit is open");
      }
    }

    try {
      const result = await this.action(...args);
      if (this.state === "half-open") {
        this.state = "closed";
        this.failures = 0;
      }
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      if (this.failures >= this.threshold) {
        this.state = "open";
      }
      throw error;
    }
  }
}

import * as fs from 'fs/promises';
import * as path from 'path';

const logDir = path.join(process.cwd(), '.logs');

export class RecipeAgentLogger {
  private readonly logFilePath: string;
  private readonly initialized: Promise<void>;

  constructor() {
    this.logFilePath = path.join(logDir, `recipe-agent-run-${Date.now()}.log`);
    this.initialized = this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  public async append(event: unknown): Promise<void> {
    await this.initialized;
    try {
      await fs.appendFile(
        this.logFilePath,
        JSON.stringify(event, null, 2) + '\n'
      );
    } catch (error) {
      console.error(
        `Failed to write to log file "${this.logFilePath}":`,
        error
      );
    }
  }
}

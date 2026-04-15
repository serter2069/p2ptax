import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface PageEntry {
  id: string;
  title: string;
  group: string;
  route: string;
  stateCount: number;
  nav: string;
  activeTab?: string;
  notes?: { date: string; state?: string; text: string }[];
  api?: string[];
  navTo?: string[];
  navFrom?: string[];
  qaScore?: number;
  qaCycles?: number;
  testScenarios?: { name: string; steps: string[] }[];
}

@Injectable()
export class ProtoService implements OnModuleInit {
  private readonly logger = new Logger(ProtoService.name);
  private pages: PageEntry[] = [];

  onModuleInit() {
    this.loadPages();
  }

  private loadPages() {
    // pageRegistry.ts lives at repo root: constants/pageRegistry.ts
    // __dirname is api/src/proto (dev) or api/dist/proto (prod) — 3 levels up = repo root
    const registryPath = path.resolve(__dirname, '..', '..', '..', 'constants', 'pageRegistry.ts');

    try {
      const content = fs.readFileSync(registryPath, 'utf-8');
      this.pages = this.parsePageRegistry(content);
      this.logger.log(`Loaded ${this.pages.length} pages from pageRegistry.ts`);
    } catch (err) {
      this.logger.error(`Failed to load pageRegistry.ts from ${registryPath}: ${err}`);
      this.pages = [];
    }
  }

  private parsePageRegistry(content: string): PageEntry[] {
    // Extract the pageRegistry array from the TS source
    // Strategy: isolate the array literal, then evaluate it as JS
    const match = content.match(
      /export\s+const\s+pageRegistry\s*:\s*PageEntry\[\]\s*=\s*(\[[\s\S]*?\n\];)/,
    );
    if (!match) {
      this.logger.error('Could not find pageRegistry array in file');
      return [];
    }

    try {
      // The array uses JS object literals — safe to eval with Function()
      // eslint-disable-next-line no-new-func
      const fn = new Function(`return ${match[1]}`);
      return fn() as PageEntry[];
    } catch (err) {
      this.logger.error(`Failed to parse pageRegistry array: ${err}`);
      return [];
    }
  }

  getPages(): PageEntry[] {
    return this.pages;
  }

  /** Reload pages from disk (useful if registry changes) */
  reload(): { count: number } {
    this.loadPages();
    return { count: this.pages.length };
  }
}

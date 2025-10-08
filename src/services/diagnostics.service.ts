import { Injectable, signal } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export interface DiagEntry {
  ts: number;
  level: 'info' | 'warn' | 'error';
  msg: string;
  meta?: any;
}

@Injectable({ providedIn: 'root' })
export class DiagnosticsService {
  private logs = signal<DiagEntry[]>([]);

  // default proxy health URL (can be overridden by UI or config)
  proxyUrl = signal<string>('http://192.168.1.100:3000/health');

  log(level: DiagEntry['level'], msg: string, meta?: any) {
    const entry: DiagEntry = { ts: Date.now(), level, msg, meta };
    this.logs.update(a => [...a, entry].slice(-2000)); // keep recent
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log']('[diag]', msg, meta || '');
  }

  getLogs(): DiagEntry[] {
    return this.logs();
  }

  clearLogs() {
    this.logs.set([]);
  }

  async pingProxy(timeoutMs = 5000) {
    const url = this.proxyUrl();
    const start = Date.now();
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      const text = await res.text().catch(() => '');
      const elapsed = Date.now() - start;
      const out = { ok: res.ok, status: res.status, body: text.slice(0, 200), elapsed };
      this.log('info', `Ping ${url} -> ${res.status} (${elapsed}ms)`, out);
      return out;
    } catch (e: any) {
      const elapsed = Date.now() - start;
      this.log('error', `Ping failed ${url}`, { error: String(e), elapsed });
      return { ok: false, status: 0, body: String(e).slice(0, 200), elapsed };
    }
  }

  async exportLogs(filename?: string) {
    const now = new Date();
    const name = filename || `necrometer-logs-${now.toISOString().replace(/[:.]/g,'-')}.json`;
    const payload = JSON.stringify({ exportedAt: now.toISOString(), logs: this.getLogs() }, null, 2);
    try {
      const result = await Filesystem.writeFile({ path: name, data: payload, directory: Directory.Documents, encoding: Encoding.UTF8 });
      this.log('info', `Exported logs to ${name}`);
      return { success: true, path: result.uri };
    } catch (e: any) {
      this.log('error', 'Export failed', { error: String(e) });
      return { success: false, error: String(e) };
    }
  }
}

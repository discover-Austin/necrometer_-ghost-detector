import { Injectable } from '@angular/core';

export interface AppEnvironment {
  production: boolean;
  useProxy: boolean;
  proxyUrl?: string;
  issuanceToken?: string;
  apiKey?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  private environment: AppEnvironment = {
    production: false,
    useProxy: false
  };

  constructor() {
    // Try to load configuration from various sources
    this.loadConfiguration();
  }

  private loadConfiguration() {
    // Try window.__env first (set via index.html or build process)
    if (typeof window !== 'undefined') {
      const w = window as any;
      if (w.__env) {
        this.environment = {
          production: w.__env.production || false,
          useProxy: w.__env.useProxy || false,
          proxyUrl: w.__env.proxyUrl,
          issuanceToken: w.__env.issuanceToken,
          apiKey: w.__env.apiKey
        };
        return;
      }
    }

    // Try localStorage (for development/testing)
    try {
      const stored = localStorage.getItem('necrometer.environment');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.environment = { ...this.environment, ...parsed };
      }
    } catch (e) {
      console.warn('Could not load environment from localStorage', e);
    }
  }

  getEnvironment(): AppEnvironment {
    return { ...this.environment };
  }

  setEnvironment(env: Partial<AppEnvironment>) {
    this.environment = { ...this.environment, ...env };
    
    // Save to localStorage for development
    if (!this.environment.production) {
      try {
        localStorage.setItem('necrometer.environment', JSON.stringify(this.environment));
      } catch (e) {
        console.warn('Could not save environment to localStorage', e);
      }
    }
  }

  isProxyMode(): boolean {
    return this.environment.useProxy && !!this.environment.proxyUrl;
  }

  getProxyUrl(): string | undefined {
    return this.environment.proxyUrl;
  }

  getIssuanceToken(): string | undefined {
    return this.environment.issuanceToken;
  }

  getApiKey(): string | undefined {
    return this.environment.apiKey;
  }

  isProduction(): boolean {
    return this.environment.production;
  }
}

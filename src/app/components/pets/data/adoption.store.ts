import { Injectable } from '@angular/core';

import { AdoptionApplication } from './adoption.model';

const STORAGE_KEY = 'tailfinder:adoption-applications';
const DEMO_DELAY_MS = 600;

/**
 * Local persistence for the demo. Replace the body of `submit` with a real API
 * call when the backend lands; the form component does not care.
 */
@Injectable({ providedIn: 'root' })
export class AdoptionStore {
  submit(application: AdoptionApplication): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(() => {
        this.#persist(application);
        resolve();
      }, DEMO_DELAY_MS);
    });
  }

  #persist(application: AdoptionApplication): void {
    const applications = this.#read();
    const next = [application, ...applications].slice(0, 10);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  #read(): AdoptionApplication[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AdoptionApplication[]) : [];
    } catch {
      return [];
    }
  }
}

import { InjectionToken } from '@angular/core';

/** Base URL for the data source. Swap the provider to point at a real backend. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

/**
 * Temporary public API with real dog photos and breed slugs.
 * Petstore's demo data is mostly test noise and its detail endpoint is unreliable.
 */
export const DOG_CEO_API_URL = 'https://dog.ceo/api';

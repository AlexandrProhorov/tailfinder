import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';

/** Raw shape returned by the public API, before any business rules run. */
export interface PetImage {
  id: string;
  breed: string;
  photoUrl: string;
}

interface DogCeoImagesResponse {
  message: string[];
  status: string;
}

interface DogCeoImageResponse {
  message: string;
  status: string;
}

/** Transport only: builds requests and returns raw API models. */
@Injectable({ providedIn: 'root' })
export class PetsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(limit = 24): Observable<PetImage[]> {
    return this.http
      .get<DogCeoImagesResponse>(`${this.baseUrl}/breeds/image/random/${limit}`)
      .pipe(
        map((response) =>
          response.message
            .map((url) => this.toPetImage(url))
            .filter((image): image is PetImage => image !== null),
        ),
      );
  }

  getById(id: string): Observable<PetImage> {
    const [breed, subBreed] = id.split('-');
    const path = subBreed
      ? `${encodeURIComponent(breed)}/${encodeURIComponent(subBreed)}`
      : encodeURIComponent(breed);

    return this.http
      .get<DogCeoImageResponse>(`${this.baseUrl}/breed/${path}/images/random`)
      .pipe(
        map((response) => {
          const image = this.toPetImage(response.message, id);

          if (!image) {
            throw new Error('The API returned an image without a breed.');
          }

          return image;
        }),
      );
  }

  /**
   * Dog CEO image URLs contain the breed path:
   * https://images.dog.ceo/breeds/retriever-golden/n02099601_6867.jpg
   */
  private toPetImage(url: string, fallbackBreed?: string): PetImage | null {
    const breed = fallbackBreed ?? /\/breeds\/([^/]+)\//.exec(url)?.[1];

    if (!breed) {
      return null;
    }

    return { id: breed, breed, photoUrl: url };
  }
}

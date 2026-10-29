import { HttpErrorResponse } from '@angular/common/http';

export function toErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Something went wrong. Please try again.';
  }

  if (error.status === 0) {
    return 'The pet API is unreachable right now. Check your connection and try again.';
  }

  if (error.status === 404) {
    return 'We could not find this pet. It may have already found a home.';
  }

  const body = error.error as { message?: string } | null;
  if (body?.message) {
    return body.message;
  }

  return `The API responded with status ${error.status}. Please try again.`;
}

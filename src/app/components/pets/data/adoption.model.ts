import { FormControl } from '@angular/forms';

export type HousingType = 'apartment' | 'house' | 'other';
export type ContactMethod = 'email' | 'phone';

export interface AdoptionApplication {
  petId: string;
  petName: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  housing: HousingType;
  hasPets: boolean;
  experience: string;
  contactMethod: ContactMethod;
  agree: boolean;
  submittedAt: string;
}

export interface AdoptionFormControls {
  petId: FormControl<string>;
  fullName: FormControl<string>;
  email: FormControl<string>;
  phone: FormControl<string>;
  city: FormControl<string>;
  housing: FormControl<HousingType | null>;
  hasPets: FormControl<boolean>;
  experience: FormControl<string>;
  contactMethod: FormControl<ContactMethod>;
  agree: FormControl<boolean>;
}

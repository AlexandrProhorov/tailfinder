import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';

import { toErrorMessage } from '../../../../core/http/to-error-message';
import {
  AdoptionApplication,
  AdoptionFormControls,
  ContactMethod,
  HousingType,
} from '../../data/adoption.model';
import { AdoptionStore } from '../../data/adoption.store';
import { PetsStore } from '../../data/pets.store';

const PHONE_PATTERN = /^\+?[\d\s()-]{7,20}$/;

@Component({
  selector: 'app-adoption-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    MatButtonModule,
    MatProgressBarModule,
  ],
  templateUrl: './adoption-form.component.html',
  styleUrl: './adoption-form.component.scss',
})
export class AdoptionFormComponent implements OnInit {
  readonly id = input.required<string>();

  readonly #fb = inject(NonNullableFormBuilder);
  readonly #destroyRef = inject(DestroyRef);
  readonly #adoptionStore = inject(AdoptionStore);
  readonly #petsStore = inject(PetsStore);

  protected readonly pet = this.#petsStore.selectedPet;
  protected readonly petLoading = this.#petsStore.selectedLoading;
  protected readonly petName = computed(() => this.pet()?.name ?? 'your new friend');
  protected readonly petBreed = computed(() => this.pet()?.category?.name ?? 'Pet');
  protected readonly petPhoto = computed(() => {
    const urls = this.pet()?.photoUrls ?? [];
    return urls.find((url) => url.startsWith('http') && !url.includes('example.com')) ?? null;
  });
  protected readonly petInitial = computed(() => this.petName().charAt(0).toUpperCase());

  protected readonly housingOptions: ReadonlyArray<{ value: HousingType; label: string }> = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House with a yard' },
    { value: 'other', label: 'Other' },
  ];

  protected readonly completion = signal(0);
  protected readonly submitted = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  protected form!: FormGroup<AdoptionFormControls>;

  ngOnInit(): void {
    this.#initForm();
    this.#setSubscription();
    this.completion.set(this.#calculateCompletion());

    void this.#petsStore.loadPet(this.id());
  }

  #initForm(): void {
    this.form = this.#fb.group<AdoptionFormControls>({
      petId: this.#fb.control(this.id(), Validators.required),
      fullName: this.#fb.control('', [Validators.required, Validators.minLength(2)]),
      email: this.#fb.control('', [Validators.required, Validators.email]),
      phone: this.#fb.control('', [
        Validators.required,
        Validators.pattern(PHONE_PATTERN),
      ]),
      city: this.#fb.control('', Validators.required),
      housing: this.#fb.control<HousingType | null>(null, Validators.required),
      hasPets: this.#fb.control(false),
      experience: this.#fb.control(''),
      contactMethod: this.#fb.control<ContactMethod>('email', Validators.required),
      agree: this.#fb.control(false, Validators.requiredTrue),
    });
  }

  #setSubscription(): void {
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(() => this.completion.set(this.#calculateCompletion()));
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    if (!value.housing) {
      return;
    }

    const application: AdoptionApplication = {
      ...value,
      housing: value.housing,
      petId: this.id(),
      petName: this.pet()?.name ?? 'Unnamed pet',
      submittedAt: new Date().toISOString(),
    };

    this.isSubmitting.set(true);
    this.submitError.set(null);

    this.#adoptionStore
      .submit(application)
      .then(() => {
        this.submitted.set(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch((error: unknown) => this.submitError.set(toErrorMessage(error)))
      .finally(() => this.isSubmitting.set(false));
  }

  #calculateCompletion(): number {
    const controls = this.form.controls;
    const required = [
      controls.fullName,
      controls.email,
      controls.phone,
      controls.city,
      controls.housing,
      controls.agree,
    ];

    const valid = required.filter((control) => control.valid).length;
    return Math.round((valid / required.length) * 100);
  }
}

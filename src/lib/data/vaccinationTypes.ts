// ============================================
// PawShield — Pre-loaded Vaccination Types
// ============================================

import { VaccinationType } from '@/types';

export const DEFAULT_VACCINATION_TYPES: Omit<VaccinationType, 'id'>[] = [
  {
    name: 'Rabies',
    description:
      'Protects against rabies virus. Required by law in most regions. Fatal if untreated.',
    category: 'core',
    defaultIntervalDays: 365,
    firstDoseMinAgeDays: 84, // 12 weeks
    breedSpecific: null,
    isSystem: true,
    createdBy: 'system',
    isActive: true,
  },
  {
    name: 'DHPP (Distemper, Hepatitis, Parvovirus, Parainfluenza)',
    description:
      'Combination vaccine protecting against four serious diseases. Critical for puppies.',
    category: 'core',
    defaultIntervalDays: 365, // annually, then every 3 years after first year
    firstDoseMinAgeDays: 42, // 6 weeks
    breedSpecific: null,
    isSystem: true,
    createdBy: 'system',
    isActive: true,
  },
  {
    name: 'Leptospirosis',
    description:
      'Protects against bacterial infection spread through contaminated water and soil.',
    category: 'core',
    defaultIntervalDays: 365,
    firstDoseMinAgeDays: 84, // 12 weeks
    breedSpecific: null,
    isSystem: true,
    createdBy: 'system',
    isActive: true,
  },
  {
    name: 'Bordetella (Kennel Cough)',
    description:
      'Prevents kennel cough. Essential if your dog visits boarding facilities, parks, or grooming.',
    category: 'non-core',
    defaultIntervalDays: 180, // 6 months
    firstDoseMinAgeDays: 56, // 8 weeks
    breedSpecific: null,
    isSystem: true,
    createdBy: 'system',
    isActive: true,
  },
  {
    name: 'Canine Influenza (H3N2/H3N8)',
    description:
      'Protects against canine flu strains. Recommended for social dogs.',
    category: 'non-core',
    defaultIntervalDays: 365,
    firstDoseMinAgeDays: 42, // 6 weeks
    breedSpecific: null,
    isSystem: true,
    createdBy: 'system',
    isActive: true,
  },
  {
    name: 'Lyme Disease',
    description:
      'Protects against Borrelia burgdorferi transmitted by ticks. Important in tick-endemic areas.',
    category: 'non-core',
    defaultIntervalDays: 365,
    firstDoseMinAgeDays: 84, // 12 weeks
    breedSpecific: null,
    isSystem: true,
    createdBy: 'system',
    isActive: true,
  },
  {
    name: 'Deworming',
    description:
      'Eliminates internal parasites (roundworms, hookworms, tapeworms). Essential from puppyhood.',
    category: 'preventive',
    defaultIntervalDays: 90, // every 3 months
    firstDoseMinAgeDays: 14, // 2 weeks
    breedSpecific: null,
    isSystem: true,
    createdBy: 'system',
    isActive: true,
  },
  {
    name: 'Anti-Tick & Flea Treatment',
    description:
      'Prevents tick and flea infestations. Critical in warm climates and during summer.',
    category: 'preventive',
    defaultIntervalDays: 30, // monthly
    firstDoseMinAgeDays: 56, // 8 weeks
    breedSpecific: null,
    isSystem: true,
    createdBy: 'system',
    isActive: true,
  },
  {
    name: 'Canine Coronavirus',
    description:
      'Protects against canine enteric coronavirus. Mainly a concern for puppies.',
    category: 'non-core',
    defaultIntervalDays: 365,
    firstDoseMinAgeDays: 42, // 6 weeks
    breedSpecific: null,
    isSystem: true,
    createdBy: 'system',
    isActive: true,
  },
  {
    name: 'Giardia Vaccine',
    description:
      'Protects against Giardia parasite. Recommended for dogs exposed to contaminated water.',
    category: 'non-core',
    defaultIntervalDays: 365,
    firstDoseMinAgeDays: 56, // 8 weeks
    breedSpecific: null,
    isSystem: true,
    createdBy: 'system',
    isActive: true,
  },
];

// Common dog breeds list for autocomplete
export const DOG_BREEDS = [
  'Labrador Retriever',
  'German Shepherd',
  'Golden Retriever',
  'French Bulldog',
  'Bulldog',
  'Poodle',
  'Beagle',
  'Rottweiler',
  'German Shorthaired Pointer',
  'Dachshund',
  'Pembroke Welsh Corgi',
  'Australian Shepherd',
  'Yorkshire Terrier',
  'Boxer',
  'Cavalier King Charles Spaniel',
  'Doberman Pinscher',
  'Great Dane',
  'Miniature Schnauzer',
  'Siberian Husky',
  'Bernese Mountain Dog',
  'Shih Tzu',
  'Pomeranian',
  'Border Collie',
  'Shetland Sheepdog',
  'Havanese',
  'Boston Terrier',
  'Cane Corso',
  'English Springer Spaniel',
  'Brittany',
  'Cocker Spaniel',
  'Maltese',
  'Chihuahua',
  'Pug',
  'Vizsla',
  'Weimaraner',
  'Belgian Malinois',
  'Dalmatian',
  'Akita',
  'Samoyed',
  'Whippet',
  'Indian Pariah Dog',
  'Indian Spitz',
  'Rajapalayam',
  'Mudhol Hound',
  'Kombai',
  'Kanni',
  'Chippiparai',
  'Mixed Breed / Indie',
  'Other',
];

// ============================================
// PawShield — Date Utilities
// ============================================

import {
  format,
  formatDistanceToNow,
  addDays,
  differenceInDays,
  isPast,
  isToday,
  parseISO,
} from 'date-fns';
import { StatusColor, VaccinationStatusInfo } from '@/types';

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d, yyyy');
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d');
}

export function formatDateLong(dateStr: string): string {
  return format(parseISO(dateStr), 'EEEE, MMMM d, yyyy');
}

export function formatRelative(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
}

export function calculateNextDueDate(
  dateAdministered: string,
  intervalDays: number
): string {
  const administered = parseISO(dateAdministered);
  const nextDue = addDays(administered, intervalDays);
  return nextDue.toISOString();
}

export function getVaccinationStatus(nextDueDate: string): VaccinationStatusInfo {
  const dueDate = parseISO(nextDueDate);
  const daysUntilDue = differenceInDays(dueDate, new Date());

  if (isPast(dueDate) && !isToday(dueDate)) {
    return {
      status: 'red' as StatusColor,
      label: `Overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''}`,
      daysUntilDue,
    };
  }

  if (isToday(dueDate)) {
    return {
      status: 'red' as StatusColor,
      label: 'Due today!',
      daysUntilDue: 0,
    };
  }

  if (daysUntilDue <= 14) {
    return {
      status: 'yellow' as StatusColor,
      label: `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
      daysUntilDue,
    };
  }

  return {
    status: 'green' as StatusColor,
    label: `Due ${formatDate(nextDueDate)}`,
    daysUntilDue,
  };
}

export function getDogAge(dateOfBirth: string): string {
  const dob = parseISO(dateOfBirth);
  const now = new Date();
  const totalDays = differenceInDays(now, dob);

  if (totalDays < 0) return 'Not born yet';

  const years = Math.floor(totalDays / 365);
  const months = Math.floor((totalDays % 365) / 30);

  if (years === 0 && months === 0) {
    return `${totalDays} day${totalDays !== 1 ? 's' : ''} old`;
  }
  if (years === 0) {
    return `${months} month${months !== 1 ? 's' : ''} old`;
  }
  if (months === 0) {
    return `${years} year${years !== 1 ? 's' : ''} old`;
  }
  return `${years}y ${months}m old`;
}

export function getAgeInDays(dateOfBirth: string): number {
  return differenceInDays(new Date(), parseISO(dateOfBirth));
}

export function toISOString(date?: Date): string {
  return (date || new Date()).toISOString();
}

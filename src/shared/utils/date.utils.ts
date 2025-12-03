export class DateUtils {
  static addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }

  static addHours(date: Date, hours: number): Date {
    return new Date(date.getTime() + hours * 60 * 60 * 1000);
  }

  static addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  static isExpired(date: Date): boolean {
    return date.getTime() < Date.now();
  }

  static formatISO(date: Date): string {
    return date.toISOString();
  }

  static parseISO(isoString: string): Date {
    return new Date(isoString);
  }
}

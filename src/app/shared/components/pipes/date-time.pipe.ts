import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateTime',
  standalone: true,
})
export class DateTimePipe implements PipeTransform {
  transform(
    value: string | Date | null | undefined,
    format: 'full' | 'date' | 'time' = 'full',
  ): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return '-';
    }

    const options: Intl.DateTimeFormatOptions =
      format === 'date'
        ? {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
          }
        : format === 'time'
          ? {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }
          : {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            };

    return new Intl.DateTimeFormat('en-US', {
      ...options,
      timeZone: 'Asia/Manila',
    }).format(date);
  }
}

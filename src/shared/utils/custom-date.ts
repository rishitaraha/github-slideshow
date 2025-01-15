import { isEmpty, isNil, isNumber, isString } from 'lodash';
import { DateTimeFormatLength } from './enums';

export class CustomDate extends Date {
  date: number | Date | null;
  dateFormat: DateTimeFormatLength;
  timeFormat: DateTimeFormatLength;

  constructor(date: number | Date | string | null | undefined) {
    super();

    this.dateFormat = DateTimeFormatLength.Medium;
    this.timeFormat = DateTimeFormatLength.Medium;

    if (isString(date)) {
      this.date = !isEmpty(date) ? new Date(Date.parse(date)) : null;
    } else if (isNumber(date)) {
      this.date = date !== 0 ? new Date(date) : null;
    } else {
      this.date = !isNil(date) ? new Date(date) : null;
    }
  }

  #formatSeparator(date, dateSeparator?: string) {
    if (isNil(dateSeparator)) {
      return date;
    }
    let currentDateSeparator = '-';

    switch (this.dateFormat) {
      case DateTimeFormatLength.Long:
        currentDateSeparator = ' ';
        break;
      case DateTimeFormatLength.Medium:
        currentDateSeparator = '-';
        break;
      case DateTimeFormatLength.Short:
        currentDateSeparator = '/';
        break;
    }

    const formattedDate = date.split(currentDateSeparator).join(dateSeparator);
    return formattedDate;
  }

  formatDate(dateFormat?: DateTimeFormatLength, dateSeparator?: string) {
    if (isNil(this.date)) {
      return;
    }
    this.dateFormat = dateFormat ?? this.dateFormat;

    const date = new Intl.DateTimeFormat('en-IN', {
      dateStyle: this.dateFormat,
    }).format(this.date);

    return this.#formatSeparator(date, dateSeparator);
  }

  formatDateTime(
    dateFormat?: DateTimeFormatLength,
    timeFormat?: DateTimeFormatLength,
  ) {
    if (isNil(this.date)) {
      return;
    }
    this.dateFormat = dateFormat ?? this.dateFormat;
    this.timeFormat = timeFormat ?? this.timeFormat;

    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: this.dateFormat,
      timeStyle: this.timeFormat,
    })
      .formatToParts(new Date(this.date))
      .map(({ type, value }) => {
        switch (type) {
          case 'dayPeriod':
            return value.toUpperCase();
          case 'weekday':
            return '';
          default:
            return value;
        }
      })
      .join('')
      .trim();
  }
}

import { DateTime } from 'luxon';

export const msToTimeString = (ms: number) => {
  const pad = (temp: number) => {
    return temp <= 9 ? '0' + `${temp}` : temp;
  };

  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / 1000 / 60) % 60);
  const hours = Math.floor((ms / 1000 / 3600) % 24);

  const humanized = [pad(hours), pad(minutes), pad(seconds)].join(':');

  return humanized;
};

export const createdAtFormatter = (createdAt: Date): string => {
  if (createdAt.toString() !== 'Invalid Date') {
    return DateTime.fromJSDate(createdAt).toFormat('dd MMM yyyy, hh:mm a');
  } else {
    return '';
  }
};

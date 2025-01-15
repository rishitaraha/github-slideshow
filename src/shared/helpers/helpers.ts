import React from 'react';

// Updates the entire array with the same value when a single object is updated.
export const fillArray: <Type>(length: number, arrayElement: Type) => Type[] = (
  length,
  arrayElement,
) => {
  return new Array(length).fill(undefined).map(() => {
    return { ...arrayElement };
  });
};

export const preventNonNumber = (
  event: React.KeyboardEvent<HTMLInputElement>,
) => {
  // These are characters that are allowed in number input.
  if (event.key === 'e' || event.key === '-' || event.key === '+') {
    event.preventDefault();
  }
};

/**
 * To prevent non-integer input in an input field by blocking
 * non-numeric characters and the decimal point.
 */
export const preventNonInteger = (
  event: React.KeyboardEvent<HTMLInputElement>,
) => {
  preventNonNumber(event);
  if (event.key === '.') {
    event.preventDefault();
  }
};

/**
 * The binarySearchNearestValue function finds the index of the element in the array that is nearest to the given number.
 * @param {number[]} array - An array of number values.
 * @param {number} value - A number for which the nearest value in the array is to be found.
 * @returns `index` - the index of nearest number to the given value
 */
export const binarySearchNearestValue = (
  array: number[],
  value: number,
): number => {
  let start = 0;
  let end = array.length - 1;

  while (start <= end) {
    const midIndex = Math.floor((start + end) / 2);
    const midValue = array[midIndex];

    if (midValue === value) {
      return midIndex;
    } else if (midValue < value) {
      start = midIndex + 1;
    } else {
      end = midIndex - 1;
    }
  }

  // 'end' might go below 0 and 'start' might exceed the array length, so we need to clamp their values.
  // 'lowerIndex' is the largest index that is less than or equal to the target value.
  const lowerIndex = Math.max(end, 0);

  // 'higherIndex' is the smallest index that is greater than or equal to the target value.
  const higherIndex = Math.min(start, array.length - 1);

  const lowerDiff = value - array[lowerIndex];
  const higherDiff = array[higherIndex] - value;
  const index = lowerDiff <= higherDiff ? lowerIndex : higherIndex;

  return index;
};

// Checking if it is middle mouse button or click with ctrl pressed.
export const shouldOpenInNewTab = (event: React.MouseEvent) => {
  return (event.button === 0 && event.ctrlKey) || event.button === 1;
};

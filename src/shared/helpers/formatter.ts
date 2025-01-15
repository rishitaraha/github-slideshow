import { camelCase, snakeCase } from 'lodash';

export const Formatter = {
  toTitleCase: (text: string, separator = ' ') => {
    const newText = text.split(separator);
    return newText
      .map((val) => {
        if (val !== '') {
          return val[0].toUpperCase() + val.slice(1).toLowerCase();
        }
      })
      .join(' ');
  },
  camelCaseToSnakeCase: (text: string) => {
    const result = text.replace(/([A-Z])/g, ' $1').trim();
    return result.split(' ').join('_').toLowerCase();
  },
  /**
   * Recursively converts keys of an object from snake case to camel case.
   * @param obj Response object whose keys we want to convert.
   * @returns Object with keys in camel case.
   */
  convertKeysSnakeToCamelCase: function convertKeysSnakeToCamelCase<ReturnType>(
    obj,
  ): ReturnType {
    if (Array.isArray(obj)) {
      return obj.map(convertKeysSnakeToCamelCase) as unknown as ReturnType;
    } else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((acc, key) => {
        const camelKey = camelCase(key);
        acc[camelKey] = convertKeysSnakeToCamelCase(obj[key]);
        return acc;
      }, {}) as unknown as ReturnType;
    }
    return obj as ReturnType;
  },

  /**
   * Recursively converts keys of an object from camel case to snake case.
   * @param obj Response object whose keys we want to convert.
   * @returns Object with keys in snake case.
   */
  convertKeysCamelCaseToSnakeCase: function convertKeysCamelCaseToSnakeCase<
    ReturnType,
  >(obj): ReturnType {
    if (Array.isArray(obj)) {
      return obj.map(convertKeysCamelCaseToSnakeCase) as unknown as ReturnType;
    } else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((acc, key) => {
        const camelKey = snakeCase(key);
        acc[camelKey] = convertKeysCamelCaseToSnakeCase(obj[key]);
        return acc;
      }, {}) as unknown as ReturnType;
    }
    return obj as ReturnType;
  },
};

export const dateFormatter = (date: Date) =>
  new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

//Ref: https://stackoverflow.com/questions/7738117/html-text-overflow-ellipsis-detection
export const isEllipsis = (ref: React.RefObject<HTMLElement | undefined>) => {
  if (ref.current) {
    const element = ref.current;
    return element.offsetWidth < element.scrollWidth;
  }
  return false;
};

import {
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
} from 'react';

export type Modify<T, R> = Omit<T, keyof R> & R;

// eslint-disable-next-line @typescript-eslint/ban-types
export type ForwardRef<T, P = {}> = ForwardRefExoticComponent<
  PropsWithoutRef<P> & RefAttributes<T>
>;

export type NoUndefinedField<T> = {
  [P in keyof T]-?: NoUndefinedField<NonNullable<T[P]>>;
};

// Ref: https://stackoverflow.com/questions/52702461/rename-key-of-typescript-object-type#:~:text=3-,In%20the%20current,-typescript%20version%204.6.2
export type RenameKey<T, U> = {
  [K in keyof U as K extends keyof T
    ? T[K] extends string
      ? T[K]
      : never
    : K]: K extends keyof U ? U[K] : never;
};

/**
 * This type guard checks if a forwarded ref is a mutable ref object for a specific HTMLElement type.
 * @param ref -  `React.forwardRef`.
 * @param elementType -  Constructor of T to check for instanceof.
 * @returns a boolean value indicating whether the provided ref is a mutable ref object for a specific
 * HTMLElement type.
 */
export const isForwardRefHTMLElement = <T extends HTMLElement>(
  ref: React.ForwardedRef<T>,
  elementType: new () => T, // Pass the constructor of T
): ref is React.MutableRefObject<T> => {
  return (
    ref !== null &&
    typeof ref !== 'function' &&
    ref.current instanceof elementType
  );
};

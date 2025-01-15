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
 * Checks if a given object belongs to the specified type T
 *
 * @param object Object of which we want to check type of.
 * @param property Property which verifies that the object belongs to that particular type.
 * @returns boolean
 */
export const isTypeOf = <T>(object: any, property: keyof T): object is T => {
  return property in object;
};

/**
 * Create an array of a particular type with fixed length.
 *
 * Example usage -
 * instead of [number, number, number, number] -> FixedLengthArray<number, 4>
 */
export type FixedLengthArray<TType, TLength extends number> = TType[] & {
  length: TLength;
};

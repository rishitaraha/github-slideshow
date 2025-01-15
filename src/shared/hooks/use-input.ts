import { isEmpty, isNil, isNull, zipObject } from 'lodash';
import React, { useState } from 'react';
import { validate } from '../helpers/input-validator';

export type InputErrorState = Record<string, string>;
export type InputDirtyState = Record<string, boolean>;
export type InputOptionalState = Record<string, boolean>;
export type InputValidatorParamsState = Record<string, any>;

export const useInputFields = <T extends Record<string, any>>(
  fields: T,
  validator: (
    name: string,
    values: Record<string, any>,
    optional?: Record<string, boolean>, // Optional fields => use in case of complex situations like radio toggle or etc.
    validatorParams?: Record<string, T>, // To use in case we want to send extra information to validator
  ) => string = validate,
  validateOnBlur = true,
  validateOnChange?: boolean,
  validatorFields = {},
) => {
  // Initilize.
  const errorFields: InputErrorState = {};
  Object.keys(fields).forEach((field) => {
    errorFields[field] = '';
  });

  const dirtyFields: InputDirtyState = {};

  const optionalFields: InputOptionalState = {};
  Object.keys(fields).forEach((field) => {
    dirtyFields[field] = false;
  });

  Object.keys(fields).forEach((field) => {
    optionalFields[field] = false;
  });

  const validatorParamFields = {};
  Object.assign(validatorParamFields, validatorFields);

  // States.
  const [values, setValues] = useState<T>(fields);
  const [errors, setErrors] = useState(errorFields);
  const [dirty, setDirty] = useState(dirtyFields);
  const [optional, setOptional] = useState(optionalFields);
  const [validatorParams, setValidatorParams] = useState(validatorParamFields);
  const names = zipObject(Object.keys(fields), Object.keys(fields));

  // Handlers.
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value[0] !== ' ') {
      let newValue: string | null = event.target.value;

      if (event.target.type == 'number' && isEmpty(newValue)) {
        newValue = null;
      }

      const newValues = { ...values, [event.target.name]: newValue };

      if (!isNull(event.target.name) && !dirty[event.target.name]) {
        setDirty({
          ...dirty,
          [event.target.name]: true,
        });
      }

      if (validateOnChange) {
        setErrors({
          ...errors,
          [event.target.name]: validator(
            event.target.name,
            newValues,
            optional,
            validatorParams,
          ),
        });
      }
      setValues(newValues);
    }
  };

  const onBlur = (
    event:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | React.FocusEvent<HTMLDivElement, Element>,
  ) => {
    const targetName: string | null =
      event.target instanceof HTMLInputElement
        ? event.target.name
        : event.target.textContent;

    if (!isNil(targetName)) {
      if (validateOnBlur) {
        setErrors({
          ...errors,
          [targetName]: validator(
            targetName,
            values,
            optional,
            validatorParams,
          ),
        });
      }
    }
  };

  const onFocus = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setErrors({
      ...errors,
      [event.target.name]: '',
    });
  };

  // Error won't be checked for optional fields.
  const inputHasError = (optionalFields?: string[]): boolean => {
    const tempErrors: InputErrorState = {};
    let errorFlag = false;
    for (const valueKey of Object.keys(values)) {
      if (!optionalFields?.includes(valueKey)) {
        const error = validator(valueKey, values, optional, validatorParams);
        tempErrors[valueKey] = error;
        if (!isEmpty(error)) {
          errorFlag = true;
        }
      }
    }
    return errorFlag;
  };

  const inputIsDirty = () => {
    let dirtyFlag = false;
    for (const dirtyValue of Object.values(dirty)) {
      if (dirtyValue) {
        dirtyFlag = true;
        break;
      }
    }
    return dirtyFlag;
  };

  const resetAll = () => {
    setDirty(dirtyFields);
    setValues(fields);
    setErrors(errorFields);
    setOptional(optionalFields);
  };

  const validateAllFields = () => {
    const tempErrors: InputErrorState = {};
    for (const valueKey of Object.keys(values)) {
      tempErrors[valueKey] = validator(
        valueKey,
        values,
        optional,
        validatorParams,
      );
    }
    setErrors(() => tempErrors);
    return isEmpty(tempErrors);
  };

  const getOptionalFields = () => {
    return Object.keys(optional).filter((key) => {
      return optional[key];
    });
  };

  return {
    names,
    values,
    setValues,
    errors,
    setErrors,
    dirty,
    setDirty,
    optional,
    setOptional,
    onChange,
    onBlur,
    onFocus,
    inputHasError,
    inputIsDirty,
    resetAll,
    validateAllFields,
    validatorParams,
    setValidatorParams,
    getOptionalFields,
  };
};

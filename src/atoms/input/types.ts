import React from 'react';
import { FormCheckInputProps } from 'react-bootstrap/esm/FormCheckInput';
import { FormControlProps } from 'react-bootstrap/esm/FormControl';
import { Placement } from '../../enums';
import { SelectProps as ReactSelectProps } from '../../molecules/select';
import { InputSearchVariant } from './enums';
import { ForwardRef } from '../../shared/type-utils';

export type InputGroupProps = {
  className?: string;
  onClick?: (event: React.MouseEvent) => void;
  children?: React.ReactNode;
};

export type CheckboxProps = FormCheckInputProps & {
  indeterminate?: boolean;
};

export type InputProps = React.HTMLProps<HTMLInputElement> & {
  isInvalid?: boolean;
  error?: string;
  dataTestId?: string;
};

export type LabelProps = React.HTMLProps<HTMLLabelElement> & {
  isRequired?: boolean;
  info?: string | React.ReactNode;
  infoPlacement?: Placement;
  tooltipClassname?: string;
  dataTestId?: string;
};

export type InputSearchProps = InputProps & {
  variant?: InputSearchVariant;
  iconSize?: number;
};

export type SelectProps = {
  error?: string;
};

export type InputError = {
  error: string | string[];
  dataTestId?: string;
};

export type InputComponents = {
  Text: ForwardRef<HTMLInputElement, InputProps>;
  TextArea: ForwardRef<HTMLTextAreaElement, FormControlProps & InputProps>;
  Number: ForwardRef<HTMLInputElement, InputProps>;
  Search: ForwardRef<HTMLInputElement, InputSearchProps>;
  Password: ForwardRef<HTMLInputElement, InputProps>;
  Select: React.FC<ReactSelectProps & SelectProps>;
  CheckBox: ForwardRef<HTMLInputElement, CheckboxProps>;
  File: ForwardRef<HTMLInputElement, InputProps>;
  Label: ForwardRef<HTMLLabelElement, LabelProps>;
  Error: React.FC<InputError>;
  Date: ForwardRef<HTMLInputElement, InputProps>;
  Color: ForwardRef<HTMLInputElement, InputProps>;
};

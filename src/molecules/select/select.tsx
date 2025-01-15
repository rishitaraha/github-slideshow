import classNames from 'classnames';
import React from 'react';
import ReactSelect, {
  components,
  DropdownIndicatorProps,
  MultiValueRemoveProps,
  ClearIndicatorProps,
  Props as ReactSelectProps,
} from 'react-select';
import { Icon } from '../../atoms';
import { ColorClass, IconIdentifier } from '../../enums';
import {
  multiSelectCustomStyle,
  selectCustomStyles,
  selectErrorStyle,
  multiSelectErrorStyle,
} from './constants';

export type SelectProps<T = any> = ReactSelectProps<T> & { isError?: boolean };

export type SelectOption<T = string> = {
  label: string;
  value: T;
};

/*
All ReactSelect components (eg: DropdownIndicator, MultiValueRemove ...) name are reserved.
so we can't rename these components.
*/

const DropdownIndicator = (
  props: JSX.IntrinsicAttributes & DropdownIndicatorProps<any>,
) => {
  return (
    <components.DropdownIndicator {...props}>
      <Icon
        identifier={IconIdentifier.ChevronSmallDown}
        colorClass={ColorClass.Neutral300}
        size={24}
      />
    </components.DropdownIndicator>
  );
};

const MultiValueRemove = (props: MultiValueRemoveProps<any>) => {
  return (
    <components.MultiValueRemove {...props}>
      <Icon
        identifier={IconIdentifier.Cross}
        size={12}
        colorClass={ColorClass.Neutral250}
      />
    </components.MultiValueRemove>
  );
};

const ClearIndicator = (props: ClearIndicatorProps<any>) => {
  return (
    <components.ClearIndicator {...props}>
      <Icon
        identifier={IconIdentifier.CrossSmall}
        size={24}
        colorClass={ColorClass.Neutral300}
      />
    </components.ClearIndicator>
  );
};

export const Select = <T = any,>({
  className,
  classNamePrefix,
  components,
  styles,
  isMulti,
  onBlur,
  onFocus,
  name,
  isError,
  ...rest
}: SelectProps<T>) => {
  const customClassName = classNames(['aus-select', className]);
  const customClassNamePrefix = classNames(['aus-select', classNamePrefix]);
  const customStyles = isMulti
    ? { ...selectCustomStyles, ...multiSelectCustomStyle }
    : selectCustomStyles;
  const errorStyle = isMulti ? multiSelectErrorStyle : selectErrorStyle;

  return (
    <ReactSelect
      className={customClassName}
      classNamePrefix={customClassNamePrefix}
      components={{
        DropdownIndicator,
        MultiValueRemove,
        ClearIndicator,
        ...components,
      }}
      styles={{ ...customStyles, ...styles, ...(isError ? errorStyle : {}) }}
      menuPortalTarget={document.body}
      isMulti={isMulti}
      name={name}
      // Adding name to the event because React select does not provide name in event.target thats why our input hook is not working for this component.
      onBlur={(event) => {
        if (onBlur) {
          name && (event.target.name = name);
          onBlur(event);
        }
      }}
      onFocus={(event) => {
        if (onFocus) {
          name && (event.target.name = name);
          onFocus(event);
        }
      }}
      {...rest}
    />
  );
};

import { StylesConfig } from 'react-select';
import { ColorCodes } from '../../enums';

// Select Styles.
const inputHeight = '3.4rem';
export const selectCustomStyles: StylesConfig<any> = {
  container: (base) => ({
    ...base,
    height: inputHeight,
  }),

  control: (base, { menuIsOpen }) => ({
    ...base,
    borderColor: ColorCodes.Neutral200,
    WebkitBoxShadow: menuIsOpen ? '0px 0px 0px 2px #bbe1ff' : 'initial',
    height: inputHeight,
    minHeight: inputHeight,
    boxShadow: 'none',
    cursor: 'pointer',
  }),

  input: (base) => ({
    ...base,
    margin: 0,
    color: ColorCodes.Neutral300,
  }),

  valueContainer: (base) => ({
    ...base,
    height: inputHeight,
    paddingLeft: '0.5rem',
    paddingTop: 0,
    paddingBottom: 0,
    marginBottom: 1,
  }),

  singleValue: (base) => ({
    ...base,
    padding: 0,
  }),

  indicatorSeparator: () => ({ display: 'none' }),

  indicatorsContainer: (styles) => ({
    ...styles,
    marginBottom: '0.4rem',
  }),

  dropdownIndicator: () => ({
    paddingRight: '0.8rem',
  }),

  menu: (base, {}) => ({ ...base, fontSize: '1.4rem', zIndex: 9999 }),

  option: (base, { isSelected }) => {
    return {
      ...base,
      backgroundColor: isSelected
        ? ColorCodes.Primary400
        : base.backgroundColor,
    };
  },

  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

export const selectErrorStyle: StylesConfig<any> = {
  control: (base, { menuIsOpen }) => ({
    ...base,
    borderColor: ColorCodes.Red500,
    WebkitBoxShadow: menuIsOpen ? '0px 0px 0px 2px #bbe1ff' : 'initial',
    height: inputHeight,
    minHeight: inputHeight,
    boxShadow: 'none',
    cursor: 'pointer',
  }),
};

// Multiple value select styles.
const multiSelectHeight = 'auto';

export const multiSelectCustomStyle: StylesConfig<any> = {
  container: (base) => ({
    ...base,
    minHeight: multiSelectHeight,
  }),

  control: (base) => ({
    ...base,
    minHeight: multiSelectHeight,
  }),

  valueContainer: (base) => ({
    ...base,
    minHeight: multiSelectHeight,
    padding: '0.5rem 0.8rem',
  }),

  multiValue: (styles) => {
    return {
      ...styles,
      backgroundColor: ColorCodes.Primary200,
      height: '2.4rem',
      padding: '0.4rem 0.8rem',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
    };
  },

  multiValueLabel: (styles) => ({
    ...styles,
    color: ColorCodes.Primary600,
    fontSize: '1.2rem',
    padding: 0,
  }),

  clearIndicator: (styles) => ({
    ...styles,
    padding: 0,
  }),

  multiValueRemove: (styles) => ({
    ...styles,
    paddingRight: 0,
    ':hover': {},
  }),
};

export const multiSelectErrorStyle: StylesConfig<any> = {
  control: (base) => ({
    ...base,
    borderColor: ColorCodes.Red500,
    minHeight: multiSelectHeight,
  }),
};

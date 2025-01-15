import { AccordionCheckBoxStatus } from './enums';

export const getCheckboxStatus = (statusArray: boolean[]) => {
  if (statusArray.every((status) => status === true)) {
    return AccordionCheckBoxStatus.Checked;
  } else if (statusArray.every((status) => status === false)) {
    return AccordionCheckBoxStatus.Unchecked;
  } else {
    return AccordionCheckBoxStatus.Indeterminate;
  }
};

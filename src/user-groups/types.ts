export type UserCheckBoxInput = {
  id: string;
  name: string;
  checked: boolean;
  show: boolean;
};

export type UserGroupAccessTag = {
  name: string;
  isChecked: boolean;
};

export type UserGroupAccessTagsList = Record<string, UserGroupAccessTag>;

export type EditUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  isOrgAdminUser: boolean;
  isDeactivateUser: boolean;
};

export type ChangePasswordInput = {
  password: string;
  confirmPassword: string;
};

export type EditUserProps = {
  show: boolean;
  email: string;
  closeEditUser: () => void;
  refetchUsers: () => void;
};

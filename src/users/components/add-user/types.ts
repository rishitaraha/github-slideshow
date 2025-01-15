export type AddUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  isOrgAdminUser: boolean;
};

export type AddUserProps = {
  show: boolean;
  closeAddUser: () => void;
  refetchUsers: () => void;
};

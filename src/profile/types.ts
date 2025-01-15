export type UpdateUserInput = {
  firstName: string;
  lastName: string;
  email: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

export type ProfileProps = {
  show: boolean;
  closeProfile: () => void;
};

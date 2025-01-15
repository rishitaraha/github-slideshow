export const UserLocalDataManager = {
  // User Display Name
  getUserName: (): string | null => localStorage.getItem('name'),
  saveUserName: (name: string): void => localStorage.setItem('name', name),
  removeUserName: () => localStorage.removeItem('name'),
};

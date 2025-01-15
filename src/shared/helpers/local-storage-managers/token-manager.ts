export const TokenManager = {
  getToken: (): string | null => localStorage.getItem('token'),

  saveToken: (token: string): void => {
    localStorage.setItem('token', token);
  },

  removeToken: () => localStorage.removeItem('token'),

  getRefreshToken: (): string | null => localStorage.getItem('refresh'),

  saveRefreshToken: (token: string): void => {
    localStorage.setItem('refresh', token);
  },

  removeRefreshToken: () => localStorage.removeItem('refresh'),
};

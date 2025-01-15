export const OrgMetaManager = {
  saveOrgId: (orgId: string): void => {
    localStorage.setItem('org_id', orgId);
  },

  getOrgId: (): string | null => localStorage.getItem('org_id'),

  removeOrgId: () => localStorage.removeItem('org_id'),

  saveOrgName: (orgName: string): void => {
    localStorage.setItem('org_name', orgName);
  },

  getOrgName: (): string | null => localStorage.getItem('org_name'),

  removeOrgName: () => localStorage.removeItem('org_name'),
};

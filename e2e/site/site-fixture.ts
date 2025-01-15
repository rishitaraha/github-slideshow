import { test as base } from '../shared/auth-fixtures';
import { SitePOM } from './site-pom';

type SiteFixtureType = {
  adminSitePOM: SitePOM;
};

export const test = base.extend<SiteFixtureType>({
  adminSitePOM: async ({ adminPage }, use) => {
    const sitePom = new SitePOM(adminPage.page);
    await sitePom.goTo();
    await use(sitePom);
  },
});

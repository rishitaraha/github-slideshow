import { test as base } from '../shared/auth-fixtures';
import { IterationPOM } from './iteration-pom';

type iterationFixtureType = {
  adminIterationPOM: IterationPOM;
};

export const test = base.extend<iterationFixtureType>({
  adminIterationPOM: async ({ adminPage }, use) => {
    const iterationPOM = new IterationPOM(adminPage.page);
    await iterationPOM.goToIteration();
    await use(iterationPOM);
  },
});

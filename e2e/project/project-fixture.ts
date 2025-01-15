import { test as base } from '../shared/auth-fixtures';
import { ProjectPOM } from './project-pom';

type ProjectFixtureType = {
  adminProject: ProjectPOM;
  memberAddProject: ProjectPOM;
  memberUpdateProject: ProjectPOM;
};

export const test = base.extend<ProjectFixtureType>({
  adminProject: async ({ adminPage }, use) => {
    const projectPom = new ProjectPOM(adminPage.page);
    await projectPom.goTo();

    // Use the fixture value in test.
    await use(projectPom);
  },

  memberAddProject: async ({ memberPage }, use) => {
    const projectPom = new ProjectPOM(memberPage.page);
    await projectPom.goTo();

    // Use the fixture value in test.
    await use(projectPom);
  },

  memberUpdateProject: async ({ memberPage }, use) => {
    const projectPom = new ProjectPOM(memberPage.page);
    await projectPom.goTo();

    // Use the fixture value in test.
    await use(projectPom);
  },
});

export { expect } from '@playwright/test';

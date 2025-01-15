import { test } from './project-fixture';
import { expect, Page } from '@playwright/test';

test.describe('Project', () => {
  test('should be able to list all projects ', async ({
    adminProject: project,
  }) => {
    // Arrange.
    const page = project.page;
    const projectList = page.getByTestId('projects-list');

    // Act.
    await page.waitForResponse('**/projects/?search=');

    // Assert.
    await expect(projectList).toBeVisible();
    await expect(projectList).toHaveCount(1);
    await expect(projectList.locator('> div:first-child')).toBeVisible();
  });

  test('should be able to navigate Project page', async ({
    adminProject: project,
  }) => {
    // Arrange.
    const page = project.page;
    const projectList = page.getByTestId('projects-list');

    // Act.
    await page.goto('/projects');

    // Assert.
    await expect(page).toHaveURL('/projects');
    await expect(projectList).toBeVisible();
    await expect(projectList).toHaveCount(1);
  });

  test('should be able to search a project', async ({
    adminProject: project,
  }) => {
    // Arrange.
    const { searchProject, page } = project;
    const projectList = page.getByTestId('projects-list');

    // Act.
    await searchProject(page, 'project');

    // Assert.
    await expect(page).toHaveURL('/projects?search=project');
    await expect(projectList).toBeVisible();
  });

  test('should see "No Project found" text when respective project not available', async ({
    adminProject: project,
  }) => {
    // Arrange.
    const { searchProject, page } = project;

    // Act.
    await searchProject(page, 'cmz');

    // Assert.
    // Ensures no project found that matches input field.
    await expect(page.getByTestId('projects-list')).not.toBeVisible();
  });
});

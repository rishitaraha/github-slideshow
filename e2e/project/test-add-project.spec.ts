import { Page } from 'playwright/test';
import { expect, test } from './project-fixture';

test.describe('Add project functionality', () => {
  const addProject = async (
    page: Page,
    projectName: string,
    addBtnId: string = 'add-project-btn'
  ): Promise<void> => {
    await page.getByTestId(addBtnId).click();
    await page.locator('input[name="name"]').fill(projectName);
    await page.getByTestId('add-project-btn-submit').click();
  };

  test.beforeEach(
    'project should be visible',
    async ({ adminProject: project }) => {
      const page = project.page;
      await page.waitForURL('/projects');
      await expect(page.getByTestId('projects-list')).toBeVisible();
    }
  );

  test('should be able to add a project', async ({ adminProject: project }) => {
    // Arrange.
    const page = project.page;
    const count = await page.locator('.project-card').count();
    let addBtnId: string;
    if (count == 0) {
      addBtnId = 'add-project-btn-initial';
    } else {
      addBtnId = 'add-project-btn';
    }

    // Act.
    await addProject(page, 'Test-project', addBtnId);
    await page.getByTestId('add-project-btn-done').click();

    // Assert.
    // side card component expected to be closed after project added.
    await expect(page.getByTestId('add-project-side-card')).not.toBeVisible();
  });

  test('should show an error when clicking add project without giving project name', async ({
    adminProject: project,
  }) => {
    // Arrange.
    const page = project.page;

    // Act.
    await page.getByTestId('add-project-btn').click();
    await page.locator('input[name="name"]').click();
    await page.getByRole('tab', { name: 'Basic' }).click();

    // Assert.
    await expect(page.getByTestId('add-project-btn-submit')).toBeDisabled();
    await expect(page.locator('text= This field is required.')).toBeVisible();
  });

  test('should displays Access Control page when valid project name is provided ', async ({
    adminProject: project,
  }) => {
    // Arrange.
    const page = project.page;
  
    // Act.
    await addProject(page, 'Test-project');

    // Assert.
    await expect(page.getByTestId("accordion-list-id")).toHaveCount(1)
    await expect(page.getByTestId('add-project-btn-done')).toBeVisible();
  });
});
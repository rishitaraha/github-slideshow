import { test } from './project-fixture';
import { expect } from './project-fixture';

test.describe('Edit Project', () => {
  test.beforeEach(
    'all projects should be visible and click the first project to edit',
    async ({ adminProject: project }) => {
      const page = project.page;
      const firstProject = page
        .getByTestId('projects-list')
        .locator('> div:first-child');
      await expect(firstProject).toBeVisible();
      firstProject.hover();
      const projectCardEditBtnDataTestId = (await firstProject.getAttribute(
        'data-testid'
      ))!.replace('card', 'btn');
      await firstProject.getByTestId(projectCardEditBtnDataTestId).click();
    }
  );

  test('should be able to update project name', async ({
    adminProject: project,
  }) => {
    // Arrange.
    const page = project.page;
    const projectName = page.locator('input[name="name"]');
    const updateProjectBtn = page.getByTestId('update-project-btn-submit');
    await expect(updateProjectBtn).toBeDisabled();

    // Act.
    await projectName.clear();
    await projectName.fill('Test-Project-1 ');
    await updateProjectBtn.click();

    // Assert.
    // Ensures that side card is closed.
    await expect(page.getByTestId('edit-project-side-card')).toBeHidden();
  });

  test('should keep updateProjectBtn disabled ,until new project name is provided', async ({
    adminProject: project,
  }) => {
    // Arrange.
    const page = project.page;
    const projectName = page.locator('input[name="name"]');
    const prevProjectName = await projectName.inputValue();

    // Act.
    await projectName.clear();
    await projectName.fill(prevProjectName);

    // Assert.
    await expect(page.getByTestId('update-project-btn-submit')).toBeDisabled();
  });

  test('should able to search the user groups in Access Control', async ({
    adminProject: project,
  }) => {
    // Arrange.
    const page = project.page;
    const accessControlBtn = page.getByRole('tab', { name: 'Access Control' });
    const inputField = page
      .getByTestId('edit-project-side-card')
      .locator('#search-box-input-field');

    // Act.
    await accessControlBtn.click();
    await inputField.click();
    await inputField.fill('Aus');

    // Assert.
    await expect(page.getByTestId('accordion-list-id')).toHaveCount(1);
  });

  test('should display "No Results Found" text in side card when user group is not present', async ({
    adminProject: project,
  }) => {
    // Arrange.
    const page = project.page;
    const accessControlBtn = page.getByRole('tab', { name: 'Access Control' });
    const inputField = page
      .getByTestId('edit-project-side-card')
      .locator('#search-box-input-field');

    // Act.
    await accessControlBtn.dblclick();
    await inputField.click();
    await inputField.fill('mtl');

    // Assert.
    await expect(page.getByTestId('accordion-list-id')).not.toBeVisible();
  });

  test('should have access to the user group by clicking "View Project" and "Manager Sites"', async ({
    adminProject: project,
  }) => {
    // Arrange.
    const page = project.page;
    const accessControlBtn = page.getByRole('tab', {
      name: 'Access Control',
    });
    const userGroup = page
      .getByTestId('accordion-list-id')
      .locator('> div:first-child');
    const inputBox = userGroup.getByRole('checkbox');
    const viewProjectCheckbox = page.getByTestId('view-project-checkbox-id');

    const manageSiteCheckbox = page.getByTestId('manage-sites-checkbox-id');

    // Act.
    await accessControlBtn.click();
    await userGroup.click();
    await inputBox.uncheck();
    await viewProjectCheckbox.click();
    await manageSiteCheckbox.click();

    // Assert.
    await expect(inputBox).toBeChecked();
  });

  test('should have access to the user group by clicking the ug-checkbox', async ({
    adminProject: project,
  }) => {
    // Arrange.
    const page = project.page;
    const accessControlBtn = page.getByRole('tab', {
      name: 'Access Control',
    });
    const userGroup = page
      .getByTestId('accordion-list-id')
      .locator('> div:first-child');
    const inputBox = userGroup.getByRole('checkbox');
    const viewProjectCheckbox = page.getByTestId('view-project-checkbox-id');

    const manageSiteCheckbox = page.getByTestId('manage-sites-checkbox-id');

    // Act.
    await accessControlBtn.click();
    await userGroup.click();
    await inputBox.check();
    const viewProjectClassName = await viewProjectCheckbox.evaluate(
      (element) => element.className
    );
    const manageSiteClassName = await manageSiteCheckbox.evaluate(
      (element) => element.className
    );
    await page.waitForSelector('.switch-card.primary.active');

    // Assert.
    expect(await viewProjectClassName.includes('active')).toBeTruthy();
    expect(await manageSiteClassName.includes('active')).toBeTruthy();
  });

  test('should have "Manage Site" checkbox automatically become unchecked when the "View Project" checkbox is unchecked', async ({
    adminProject: project,
  }) => {
    // Arrange.
    const page = project.page;
    const accessControlBtn = page.getByRole('tab', {
      name: 'Access Control',
    });
    const userGroup = page
      .getByTestId('accordion-list-id')
      .locator('> div:first-child');
    const inputBox = userGroup.getByRole('checkbox');
    const viewProjectCheckbox = page.getByTestId('view-project-checkbox-id');

    const manageSiteCheckbox = page.getByTestId('manage-sites-checkbox-id');

    // Act.
    await accessControlBtn.click();
    await userGroup.click();
    if (!(await inputBox.isChecked())) {
      await inputBox.check();
    }

    await viewProjectCheckbox.click();
    await page.waitForSelector('.switch-card.primary');
    const viewProjectClassName = await viewProjectCheckbox.evaluate(
      (element) => element.className
    );
    const manageSiteClassName = await manageSiteCheckbox.evaluate(
      (element) => element.className
    );

    //Assert.
    expect(await viewProjectClassName.includes('active')).toBeFalsy();
    expect(await manageSiteClassName.includes('active')).toBeFalsy();
  });

  test('should have "View Project" checkbox automatically become checked when the "Manage Sites" checkbox is checked', async ({
    adminProject: project,
  }) => {
    // Arrange.
    const page = project.page;
    const accessControlBtn = page.getByRole('tab', {
      name: 'Access Control',
    });
    const userGroup = page
      .getByTestId('accordion-list-id')
      .locator('> div:first-child');
    const inputBox = userGroup.getByRole('checkbox');
    const manageSiteCheckbox = page.getByTestId('manage-sites-checkbox-id');
    const viewProjectCheckbox = page.getByTestId('view-project-checkbox-id');

    // Act.
    await accessControlBtn.click();
    if (await inputBox.isChecked()) {
      await inputBox.uncheck();
    }
    await userGroup.click();
    await manageSiteCheckbox.click();
    await page.waitForSelector('.switch-card.primary.active');
    const viewProjectClassName = await viewProjectCheckbox.evaluate(
      (element) => element.className
    );

    // Assert.
    expect(await viewProjectClassName.includes('active')).toBeTruthy();
  });
});

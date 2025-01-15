import { expect } from 'playwright/test';
import { test } from './site-fixture';

test.describe('Site Access Control', () => {
  test.beforeEach(
    'sites should be visible',
    async ({ adminSitePOM: sitePOM }) => {
      const { sitesList } = sitePOM;
      await expect(sitesList).toBeVisible();
    }
  );

  test('Org Admin should have access to the user group by clicking "View " and "Create and Manage" checkboxes', async ({
    adminSitePOM: sitePOM,
  }) => {
    // Arrange.
    const {
      editFirstSiteBtn,
      viewSiteCheckbox,
      createAndManageCheckbox,
      accessControlTab,
      firstUserGroup,
      firstUserGroupCheckbox,
    } = sitePOM;

    // Act.
    await editFirstSiteBtn.click();
    await accessControlTab.click();
    await firstUserGroup.click();
    await firstUserGroupCheckbox.uncheck();
    await viewSiteCheckbox.click();
    await createAndManageCheckbox.click();

    // Assert.
    await expect(firstUserGroupCheckbox).toBeChecked();
  });

  test('Org Admin should have access to the user group by clicking the user group checkbox', async ({
    adminSitePOM: sitePOM,
  }) => {
    // Arrange.
    const {
      page,
      viewSiteCheckbox,
      createAndManageCheckbox,
      accessControlTab,
      firstUserGroup,
      firstUserGroupCheckbox,
      editFirstSiteBtn,
    } = sitePOM;

    // Act.
    await editFirstSiteBtn.click();
    await accessControlTab.click();
    await firstUserGroup.click();
    await firstUserGroupCheckbox.check();
    const viewSiteClassName = await viewSiteCheckbox.evaluate(
      (element) => element.className
    );
    const manageSiteClassName = await createAndManageCheckbox.evaluate(
      (element) => element.className
    );
    await page.waitForSelector('.switch-card.primary.active');

    // Assert.
    expect(await viewSiteClassName.includes('active')).toBeTruthy();
    expect(await manageSiteClassName.includes('active')).toBeTruthy();
  });

  test('should automatically uncheck "Create and Manage" checkbox when "View" checkbox is unchecked', async ({
    adminSitePOM: sitePOM,
  }) => {
    // Arrange.
    const {
      page,
      viewSiteCheckbox,
      createAndManageCheckbox,
      accessControlTab,
      firstUserGroup,
      firstUserGroupCheckbox,
      editFirstSiteBtn,
    } = sitePOM;

    // Act.
    await editFirstSiteBtn.click();
    await accessControlTab.click();
    await firstUserGroup.click();
    await firstUserGroupCheckbox.check();

    await viewSiteCheckbox.click();
    await page.waitForSelector('.switch-card.primary');
    const viewSiteClassName = await viewSiteCheckbox.evaluate(
      (element) => element.className
    );
    const manageSiteClassName = await createAndManageCheckbox.evaluate(
      (element) => element.className
    );

    //Assert.
    expect(await viewSiteClassName.includes('active')).toBeFalsy();
    expect(await manageSiteClassName.includes('active')).toBeFalsy();
  });

  test('should automatically check "View" checkbox when "Create and Manage" checkbox is checked', async ({
    adminSitePOM: sitePOM,
  }) => {
    // Arrange.
    const {
      page,
      viewSiteCheckbox,
      createAndManageCheckbox,
      editFirstSiteBtn,
      accessControlTab,
      firstUserGroup,
      firstUserGroupCheckbox,
    } = sitePOM;

    // Act.
    await editFirstSiteBtn.click();
    await accessControlTab.click();
    await firstUserGroupCheckbox.uncheck();
    await firstUserGroup.click();
    await createAndManageCheckbox.click();
    await page.waitForSelector('.switch-card.primary.active');
    const viewSiteClassName = await viewSiteCheckbox.evaluate(
      (element) => element.className
    );

    // Assert.
    expect(await viewSiteClassName.includes('active')).toBeTruthy();
  });
});

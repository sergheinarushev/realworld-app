import { expect, test } from "@playwright/test";
import { faker } from "@faker-js/faker";

const baseUrl = 'http://localhost:3000';

test.describe('Signin and Login spec', () => {
  let userName;
  let password;

  test('should register an account', async ({ page }) => {
    await page.goto(baseUrl);
    const signinTitle = await page.$('h1');
    const signinTitleText = await signinTitle?.textContent();
    expect(signinTitleText).toBe('Sign in');

    await page.locator('[data-test="signup"]').click();
    await page.waitForTimeout(2000);
    await page.locator('[data-test="signup"]').click();
    const signupTitle = await page.$('[data-test="signup-title"]');
    const signupTitleText = await signupTitle?.textContent();


    let firstName = faker.name.firstName();
    let lastName = faker.name.lastName();
    userName = `${firstName}_${lastName}`;
    password = faker.internet.password();

    await page.locator('[data-test=signup-first-name]').click();
    await page.locator('[data-test=signup-first-name]').type(firstName);
    await page.locator('[data-test=signup-last-name]').click();
    await page.locator('[data-test=signup-last-name]').type(lastName);
    await page.locator('[data-test=signup-username]').click();
    await page.locator('[data-test=signup-username]').type(userName);
    await page.locator('[data-test=signup-password]').click();
    await page.locator('[data-test=signup-password]').type(password);
    await page.locator('[data-test=signup-confirmPassword]').click();
    await page.locator('[data-test=signup-confirmPassword]').type(password);
    await page.locator('[data-test=signup-submit]').click();
    expect(signinTitleText).toBe('Sign in');
  })

  test('should log in just reqistered account', async ({ page }) => {
    await page.goto(`${baseUrl}/signin`);
    await page.locator('input[name="username"]').click();
    await page.locator('input[name="username"]').fill(userName);
    await page.locator('input[name="password"]').click();
    await page.locator('input[name="password"]').fill(password);
    await page.locator('[data-test="signin-submit"]').click()
    await expect(page).toHaveURL(baseUrl);
  })
});

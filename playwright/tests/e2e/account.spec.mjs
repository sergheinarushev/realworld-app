import { expect, test } from "@playwright/test";
import { faker } from "@faker-js/faker";

import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';
import path from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFilePath = path.join(__dirname, '..', '..', '..', 'data', 'database.json');
const usersFilePath = path.join(__dirname, '..', '..', '..', 'cypress', 'fixtures', 'users.json');
const baseUrl = 'http://localhost:3000';
let users;
let database;
let companyName;

test.describe('Account spec', () => {
  test.beforeAll(async ({ }) => {
    try {
      const dbData = await readFile(dbFilePath, 'utf8');
      database = JSON.parse(dbData);
      const usersData = await readFile(usersFilePath, 'utf8');
      users = JSON.parse(usersData);
    } catch (error) {
      console.error('Error reading database file:', error);
    }
  });



  test.beforeEach(async ({ page }) => {
    await page.goto(`${baseUrl}/signin`);
    // Click input[name="username"]
    await page.locator('input[name="username"]').click();
    // Fill input[name="username"]
    await page.locator('input[name="username"]').fill(users.testuser.username);
    // Click input[name="password"]
    await page.locator('input[name="password"]').click();
    // Fill input[name="password"]
    await page.locator('input[name="password"]').fill(users.testuser.password);
    // Click [data-test="signin-submit"]
    await Promise.all([
      page.waitForNavigation({ url: baseUrl }),
      page.locator('[data-test="signin-submit"]').click()
    ]);
  });

  test('should see account details', async ({ page }) => {
    // verify 'Home' page content is visible
    const homePageContentElement = page.locator('[data-test="nav-transaction-tabs"]');
    await expect(homePageContentElement).toBeVisible();
    // verify 'My Account' page content is visible
    await page.locator('[data-test="sidenav-user-settings"]').click();
    const myAccountPageContentElement = page.locator('h2');
    const myAccountPageContentElementText = await myAccountPageContentElement?.textContent();
    expect(myAccountPageContentElementText).toBe('User Settings');
    // verify 'Bank Accounts' page congtent is visible
    await page.locator('[data-test="sidenav-bankaccounts"]').click();
    const bankAccountsPageContentElement = page.locator('h2');
    const bankAccountsPageContentElementText = await bankAccountsPageContentElement?.textContent();
    expect(bankAccountsPageContentElementText).toBe('Bank Accounts');
    // verify 'Notifications' page congtent is visible
    await page.locator('[data-test="sidenav-notifications"]').click();
    const notificationsPageContentElement = page.locator('h2');
    const notificationsPageContentElementText = await notificationsPageContentElement?.textContent();
    expect(notificationsPageContentElementText).toBe('Notifications');
  })

  test('should see account balance', async ({ page }) => {
    let user = database.users.find(user => user.username === users.testuser.username);
    const balance = user ? user.balance : null;
    const formattedBalance = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(balance / 100);
    const userBalanceElement = page.locator('[data-test="sidenav-user-balance"]')
    const userBalanceElementText = await userBalanceElement?.textContent();
    expect(userBalanceElementText).toBe(formattedBalance);
  })

  test('should see account transactions history', async ({ page }) => {
    // verify 'Everyone' tab content is visible
    await page.locator('[data-test="nav-public-tab"]').click();
    await page.waitForSelector('div:has-text("Public"):visible');
    await page.waitForSelector('[data-test="transaction-list"]');
    // verify 'Friends' tab content is visible
    await page.locator('[data-test="nav-contacts-tab"]').click();
    await page.waitForSelector('div:has-text("Contacts"):visible');
    await page.waitForSelector('[data-test="transaction-list"]');
    // verify 'Mine' tab content is visible
    await page.locator('[data-test="nav-personal-tab"]').click();
    await page.waitForSelector('div:has-text("Personal"):visible');
    await page.waitForSelector('[data-test="transaction-list"]');
  })

  test('should see account transaction details', async ({ page }) => {
    const transactionId = '183VHWyuQMS';
    const transactionItemDataTest = `transaction-item-${transactionId}`;
    await page.locator(`[data-test=${transactionItemDataTest}]`).click();
    let transaction = database.transactions
      .find(transaction => transaction.id === transactionId);
    const sender = database.users.find(user => user.id === transaction.senderId);
    const receiver = database.users.find(user => user.id === transaction.receiverId);
    const senderFullName = `${sender.firstName} ${sender.lastName}`;
    const receiverFullName = `${receiver.firstName} ${receiver.lastName}`;

    const headerElement = page.locator('[data-test="transaction-detail-header"]');
    const headerElementText = await headerElement?.textContent();
    expect(headerElementText).toBe('Transaction Detail');

    const senderElement = page.locator(`span[data-test="transaction-sender-${transactionId}"]`);
    // await page.waitForTimeout(30000);
    const senderElementText = await senderElement?.textContent();
    expect(senderElementText).toBe(senderFullName);

    const actionElement = page.locator(`[data-test="transaction-action-${transactionId}"]`);
    const actionElementText = await actionElement?.textContent();
    expect(actionElementText).toBe(' paid ');

    const receiverElement = page.locator(`[data-test="transaction-receiver-${transactionId}"]`);
    const receiverElementText = await receiverElement?.textContent();
    expect(receiverElementText).toBe(receiverFullName);

    const descriptionElement = page.locator('[data-test="transaction-description"]');
    const descriptionElementText = await descriptionElement?.textContent();
    expect(descriptionElementText).toBe(transaction.description);

    const formattedBalance = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(transaction.amount / 100);
    const amountElement = page.locator(`[data-test="transaction-amount-${transactionId}"]`);
    const amountElementText = await amountElement?.textContent();
    expect(amountElementText).toContain(formattedBalance);
  })

  test('should update account user settings', async ({ page }) => {
    await page.locator('[data-test="sidenav-user-settings"]').click();
    const phoneNumber = faker.phone.phoneNumberFormat();
    await page.locator('[data-test="user-settings-phoneNumber-input"]').fill(phoneNumber);
    await page.locator('[data-test="user-settings-submit"]').click();
    await page.waitForTimeout(200);

    let dbData;
    try {
      dbData = await readFile(dbFilePath, 'utf8');
      database = JSON.parse(dbData);
    } catch (error) {
      console.error('Error reading database file:', error);
    }
    const user = database.users.find(user => user.username === users.testuser.username);
    const updatedPhoneNumber = user?.phoneNumber;
    expect(updatedPhoneNumber).toBe(phoneNumber);
  })

  test('should add new bank account', async ({ page }) => {
    companyName = faker.company.companyName();
    await page.locator('[data-test="sidenav-bankaccounts"]').click();
    await page.waitForTimeout(1000);
    await page.locator('[data-test="bankaccount-new"]').click();
    let titleElement = page.locator('h2');
    let titleElementText = await titleElement?.textContent();
    expect(titleElementText).toBe('Create Bank Account');
    await page.locator('[data-test="bankaccount-bankName-input"]').click();
    await page.locator('[data-test="bankaccount-bankName-input"]').type(companyName);
    await page.locator('[data-test="bankaccount-routingNumber-input"]').click();
    await page.locator('[data-test="bankaccount-routingNumber-input"]').type(faker.finance.routingNumber());
    await page.locator('[data-test="bankaccount-accountNumber-input"]').click();
    await page.locator('[data-test="bankaccount-accountNumber-input"]').type(faker.finance.routingNumber());
    await page.locator('[data-test="bankaccount-submit"]').click();
    titleElement = page.locator('h2');
    titleElementText = await titleElement?.textContent();
    expect(titleElementText).toBe('Bank Accounts');
    await page.locator('footer').scrollIntoViewIfNeeded();
    await page.waitForSelector(`li:has-text("${companyName}")`, { state: 'visible' });
  })

  test('should delete bank account', async ({ page }) => {
    await page.locator('[data-test="sidenav-bankaccounts"]').click();
    await page.locator('footer').scrollIntoViewIfNeeded();
    await page.waitForSelector(`li:has-text("${companyName}")`, { state: 'visible' });
    const bankAccountListItem = await page.locator('[data-test^="bankaccount-list-item"]').last();
    await bankAccountListItem.locator('[data-test="bankaccount-delete"]').click();
    await page.waitForSelector(`li:has-text("${companyName} (Deleted)")`, { state: 'visible' });
  })
});

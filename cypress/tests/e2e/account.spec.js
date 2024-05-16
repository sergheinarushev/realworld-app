import { faker } from "@faker-js/faker";

describe('Account spec', () => {
  let database;
  let testUserName;
  let testUserPassword;
  let companyName;

  before(() => {
    cy.fixture('users').then(data => {
      testUserName = data.testuser.username;
      testUserPassword = data.testuser.password;
    });

    cy.fixture('../../data/database.json').then(data => {
      database = data;
    });
  });

  beforeEach(() => {
    cy.visit('/');
  });

  it('should see account details', function () {
    cy.login(testUserName, testUserPassword);
    // verify 'Home' page congtent is visible
    cy.getBySel('nav-transaction-tabs').should('be.visible');
    // verify 'My Account' page congtent is visible
    cy.getBySel('sidenav-user-settings').click();
    cy.get('h2').should('have.text', 'User Settings').and('be.visible');
    // verify 'Bank Accounts' page congtent is visible
    cy.getBySel('sidenav-bankaccounts').click();
    cy.get('h2').should('have.text', 'Bank Accounts').and('be.visible');
    // verify 'Notifications' page congtent is visible
    cy.getBySel('sidenav-notifications').click();
    cy.get('h2').should('have.text', 'Notifications').and('be.visible');
  });

  it('should see account balance', function () {
    cy.login(testUserName, testUserPassword);
    let balance = database.users.find(user => user.username === testUserName).balance;
    const formattedBalance = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(balance / 100);
    cy.getBySel('sidenav-user-balance').should('have.text', formattedBalance);
  });

  it('should see account transactions history', function () {
    cy.login(testUserName, testUserPassword);
    // verify 'Everyone' tab content is visible
    cy.getBySel('nav-public-tab').click();
    cy.get('div').contains('Public').and('be.visible');
    cy.getBySel('transaction-list').should('exist');
    // verify 'Friends' tab content is visible
    cy.getBySel('nav-contacts-tab').click();
    cy.get('div').contains('Contacts').and('be.visible');
    cy.getBySel('transaction-list').should('exist');
    // verify 'Mine' tab content is visible
    cy.getBySel('nav-personal-tab').click();
    cy.get('div').contains('Personal').and('be.visible');
    cy.getBySel('transaction-list').should('exist');
  });

  it('should see account transaction details', function () {
    const transactionId = '183VHWyuQMS';
    const transactionItemDataTest = `transaction-item-${transactionId}`;

    cy.login(testUserName, testUserPassword);

    cy.get(`[data-test=${transactionItemDataTest}]`).click();

    let transaction = database.transactions
      .find(transaction => transaction.id === transactionId);
    const sender = database.users.find(user => user.id === transaction.senderId);
    const receiver = database.users.find(user => user.id === transaction.receiverId);
    const senderFullName = `${sender.firstName} ${sender.lastName}`;
    const receiverFullName = `${receiver.firstName} ${receiver.lastName}`;
    cy.get('[data-test=transaction-detail-header]').should('have.text', 'Transaction Detail');
    cy.getBySelLike('transaction-sender').should('have.text', senderFullName);
    cy.getBySelLike('transaction-action').should('have.text', ' paid ');
    cy.getBySelLike('transaction-receiver').should('have.text', receiverFullName);
    cy.get('[data-test=transaction-description]').should('have.text', `${transaction.description}`);
    const formattedBalance = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(transaction.amount / 100);
    cy.getBySelLike('transaction-amount').should('contain.text', formattedBalance);    
  });



  it('should update account user settings', function () {
    cy.login(testUserName, testUserPassword);
    cy.getBySel('sidenav-user-settings').click();
    const phoneNumber = faker.phone.phoneNumberFormat();
    cy.getBySel('user-settings-phoneNumber-input').clear().type(phoneNumber);
    cy.getBySel('user-settings-submit').click();

    let updatedPhoneNumber;
    cy.wait(1000);
    cy.readFile('data/database.json').then(data => {
      const user = data.users.find(user => user.username === testUserName);
      updatedPhoneNumber = user.phoneNumber;
      cy.task('log', `updated phone number: ${updatedPhoneNumber}`)
        .then(() => {
          expect(updatedPhoneNumber).to.eq(phoneNumber);
        });
    });
  });

  it('should add new bank account', function () {
      companyName = faker.company.companyName();
      cy.login(testUserName, testUserPassword);
      cy.getBySel('sidenav-bankaccounts').click();
      cy.wait(1000);
      cy.getBySel('bankaccount-new').click({force: true});
      cy.get('h2').should('have.text', 'Create Bank Account').and('be.visible');
      cy.getBySel('bankaccount-bankName-input').type(companyName);
      cy.getBySel('bankaccount-routingNumber-input').type(faker.finance.routingNumber());
      cy.getBySel('bankaccount-accountNumber-input').type(faker.finance.routingNumber());
      cy.getBySel('bankaccount-submit').click();
      cy.get('h2').should('have.text', 'Bank Accounts').and('be.visible');
      cy.wait(1000);
      cy.get('footer').scrollIntoView().wait(500);
      cy.get('li').contains(companyName).and('be.visible');
  });

  it('should delete bank account', function () {
      cy.login(testUserName, testUserPassword);
      cy.getBySel('sidenav-bankaccounts').click();
      cy.get('footer').scrollIntoView().wait(500);
      cy.get('li').contains(companyName).and('be.visible');
      cy.getBySelLike('bankaccount-list-item').last()
        .find('[data-test="bankaccount-delete"]').click();
      cy.get('li').contains(`${companyName} (Deleted)`).and('be.visible');
  });

});

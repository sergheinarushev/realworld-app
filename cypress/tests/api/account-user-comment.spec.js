import { faker } from "@faker-js/faker";

describe('Bank account, user profile and comment tests', () => {
  let users;
  let baseUri;
  let bankAccountId;
  let database;


  before(() => {
    cy.fixture('users').then(data => {
      users = data;
      // cy.log("logxxx")
      // cy.task('log', 'users >>>>>>>>>>>>>>>>>>>>>> cy.task')
      baseUri = Cypress.env("apiUrl");
    });
    cy.fixture('../../data/database.json').then(data => {
      database = data;
    });
  });

  beforeEach(() => {
    cy.loginByApi(users.testuser.username, users.testuser.password);
  });

  it('should get a list of bank accounts for user', () => {
    cy.request({
      method: 'GET',
      url: `${baseUri}/bankaccounts`,
    }).then(response => {
      // cy.log(`API response: ${JSON.stringify(response, null, 2)}`);
      expect(response.status).to.eq(200);
      Object.values(response.body.results).forEach((node) => {
        expect(node).to.have.property('id');
        expect(node).to.have.property('uuid');
        expect(node).to.have.property('userId');
        expect(node).to.have.property('bankName');
        expect(node).to.have.property('accountNumber');
        expect(node).to.have.property('routingNumber');
        expect(node).to.have.property('isDeleted');
        expect(node).to.have.property('createdAt');
        expect(node).to.have.property('modifiedAt');
      });
    });
  });

  it('should delete a bank account', () => {
    // create a bank account that is going to be removed
    const createBankAccountMutation =
      `mutation CreateBankAccount($bankName: String!, $accountNumber: String!, $routingNumber: String!) {
      createBankAccount(
        bankName: $bankName
        accountNumber: $accountNumber
        routingNumber: $routingNumber
      ) {
        id
        uuid
        userId
        bankName
        accountNumber
        routingNumber
        isDeleted
        createdAt
      }
    }`;

    const variables = {
      userId: 't45AiwidW',
      bankName: faker.company.companyName(),
      accountNumber: faker.finance.account(9),
      routingNumber: faker.finance.account(9),
    };

    cy.request({
      method: 'POST',
      url: `${baseUri}/graphql`,
      body: {
        operationName: 'CreateBankAccount',
        query: createBankAccountMutation,
        variables,
      },
    }).then((response) => {
      expect(response.status).to.equal(200);

      // Fetch the 'id' from the response
      bankAccountId = response.body.data.createBankAccount.id;

      cy.request({
        method: 'DELETE',
        url: `${baseUri}/bankAccounts/${bankAccountId}`,
      }).then(response => {
        expect(response.status).to.eq(200);
      });
    });
  });


  it('should get a user profile by username', () => {
    let testUserName = users.testuser.username;
    cy.request({
      method: 'GET',
      url: `${baseUri}/users/profile/${testUserName}`,
    }).then(response => {
      expect(response.status).to.eq(200);
      let userFromDb = database.users.find(user => user.username === testUserName);
      expect(response.body.user.firstName).to.eq(userFromDb.firstName);
      expect(response.body.user.lastName).to.eq(userFromDb.lastName);
    });
  });


  it('should create a new comment for a transaction', () => {
    let transactionFromDb = database.transactions[0];
    let content = faker.lorem.words(5);
    // cy.log(`API response: ${content}`);
    cy.request({
      method: 'POST',
      url: `${baseUri}/comments/${transactionFromDb.id}`,
      body: {
        transactionId: `${transactionFromDb.id}`,
        content: `${content}`
      }
    }).then(response => {
      expect(response.status).to.eq(200);

      cy.readFile('data/database.json').then(data => {
        const commentFromDB = data.comments.find(comment => comment.content === content);
        cy.task('log', `comment from db: ${JSON.stringify(commentFromDB)}`)
          .then(() => {
            expect(commentFromDB.content).to.eq(content);
            expect(commentFromDB.transactionId).to.eq(transactionFromDb.id);
          });
      });
    });
  });

  it('should get list of users', () => {
    cy.request({
      method: 'GET',
      url: `${baseUri}/users`,
    }).then(response => {
      expect(response.status).to.eq(200);
      // cy.task('log', `users response : ${JSON.stringify(response, null, 2)}`);
      Object.values(response.body.results).forEach((node) => {
        expect(node).to.have.property('id');
        expect(node).to.have.property('uuid');
        expect(node).to.have.property('firstName');
        expect(node).to.have.property('lastName');
        expect(node).to.have.property('username');
        expect(node).to.have.property('password');
        expect(node).to.have.property('balance');
        expect(node).to.have.property('createdAt');
        expect(node).to.have.property('modifiedAt');
      });
    });
  });

});

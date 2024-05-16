import { faker } from "@faker-js/faker";

describe('Signin and Login spec', () => {
  let userName;
  let password;

  beforeEach(() => {
    cy.visit('/');
  });

  it('should register an account', function () {
    cy.get('[data-test="signup"]').click();

    let firstName = faker.name.firstName();
    let lastName = faker.name.lastName();
    userName = `${firstName}_${lastName}`;
    password = faker.internet.password();
    cy.get('[data-test=signup-first-name]').type(firstName);
    cy.get('[data-test=signup-last-name]').type(lastName);
    cy.get('[data-test=signup-username]').type(userName);
    cy.get('[data-test=signup-password]').type(password);
    cy.get('[data-test=signup-confirmPassword]').type(password);

    cy.get('[data-test=signup-submit]').click();
  });

  it('should log in just reqistered account', function () {
    cy.login(userName, password);
    cy.get('[data-test=sidenav-username]').should('exist').contains(userName);
  });
});

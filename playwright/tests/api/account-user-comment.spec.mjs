import { expect, test } from "@playwright/test";
import { faker } from "@faker-js/faker";
import axios from 'axios';

import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';
import path from 'path';

const baseUrlApi = 'http://localhost:3002';
const bankAccountsUrl = `${baseUrlApi}/bankAccounts`;
let dbFilePath;
let users;
let database;
let connectSid;
let headers = {};

async function loginByApi(username, password, type) {
    const response = await axios.post(`${baseUrlApi}/login`, {
        username, password, type
    });
    const cookies = response.headers['set-cookie'];
    connectSid = cookies.find(cookie => cookie.startsWith('connect.sid')).split(';')[0];
}

test.describe('Bank account, user profile and comment tests', () => {
    test.beforeAll(async ({ }) => {
        try {
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            dbFilePath = path.join(__dirname, '..', '..', '..', 'data', 'database.json');
            const dbData = await readFile(dbFilePath, 'utf8');
            database = JSON.parse(dbData);
            const usersFilePath = path.join(__dirname, '..', '..', '..', 'cypress', 'fixtures', 'users.json');
            const usersData = await readFile(usersFilePath, 'utf8');
            users = JSON.parse(usersData);
        } catch (error) {
            console.error('Error reading database file:', error);
        }

        await loginByApi(users.testuser.username, users.testuser.password, 'LOGIN');
        headers = {
            'Cookie': connectSid
        };
    });

    test('should get a list of bank accounts for user', async () => {
        const response = await axios.get(`${bankAccountsUrl}`, {
            headers
        });
        // console.log(`Data: ${JSON.stringify(response.data, null, 2)}`);

        expect(response.status).toBe(200);
        const results = response.data.results;
        results.forEach(node => {
            expect(node).toHaveProperty('id');
            expect(node).toHaveProperty('uuid');
            expect(node).toHaveProperty('userId');
            expect(node).toHaveProperty('bankName');
            expect(node).toHaveProperty('accountNumber');
            expect(node).toHaveProperty('routingNumber');
            expect(node).toHaveProperty('isDeleted');
            expect(node).toHaveProperty('createdAt');
            expect(node).toHaveProperty('modifiedAt');
        });
    });

    test('should delete a bank account', async () => {
        // Create a bank account that is going to be removed
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

        const response = await axios.post(`${baseUrlApi}/graphql`, {
            operationName: 'CreateBankAccount',
            query: createBankAccountMutation,
            variables
        }, {
            headers
        });
        expect(response.status).toBe(200);

        const bankAccountId = response.data.data.createBankAccount.id;
        const deleteResponse = await axios.delete(`${baseUrlApi}/bankAccounts/${bankAccountId}`, {
            headers
        });
        expect(deleteResponse.status).toBe(200);
    });

    test('should get a user profile by username', async () => {
        const testUserName = users.testuser.username;
        const response = await axios.get(`${baseUrlApi}/users/profile/${testUserName}`, {
            headers
        });

        expect(response.status).toBe(200);
        const results = response.data.results;
        let userFromDb = database.users.find(user => user.username === testUserName);
        expect(response.data.user.firstName).toBe(userFromDb.firstName);
        expect(response.data.user.lastName).toBe(userFromDb.lastName);
    });

    test('should create a new comment for a transaction', async () => {
        const transactionFromDb = database.transactions[0];
        const content = faker.lorem.words(5);
        const response = await axios.post(`${baseUrlApi}/comments/${transactionFromDb.id}`, {
            transactionId: `${transactionFromDb.id}`,
            content: `${content}`
        }, {
            headers
        });
        expect(response.status).toBe(200);
        const results = response.data.results;

        try {
            const dbData = await readFile(dbFilePath, 'utf8');
            database = JSON.parse(dbData);
        } catch (error) {
            console.error('Error reading database file:', error);
        }
        const commentFromDB = database.comments.find(comment => comment.content === content);
        expect(commentFromDB.content).toBe(content);
        expect(commentFromDB.transactionId).toBe(transactionFromDb.id);
    });

    test('should get list of users', async () => {
        const response = await axios.get(`${baseUrlApi}/users`, {
            headers
        });

        expect(response.status).toBe(200);
        const results = response.data.results;
        results.forEach(node => {
            expect(node).toHaveProperty('id');
            expect(node).toHaveProperty('uuid');
            expect(node).toHaveProperty('firstName');
            expect(node).toHaveProperty('lastName');
            expect(node).toHaveProperty('username');
            expect(node).toHaveProperty('password');
            expect(node).toHaveProperty('balance');
            expect(node).toHaveProperty('createdAt');
            expect(node).toHaveProperty('modifiedAt');
        });
    });

});

import { request } from 'graphql-request';
import { AddressInfo } from 'net';

import { User } from '../../entity/User';
import { startServer } from '../../startServer';
import {
  duplicateEmail,
  emailNotLongEnough,
  passwordNotLongEnough,
  invalidEmail,
} from './errorMessages';

let getHost = () => '';

beforeAll(async () => {
  const app = await startServer();
  const { port } = app.address() as AddressInfo;
  getHost = () => `http://127.0.0.1:${port}`;
});

const email = "test@test.com";
const password = "test123";

const mutation = (e: string, p: string): string => `
  mutation {
    register(email: "${e}", password: "${p}") {
      path
      message
    }
  }
`;


describe("Register user", async () => {
  it("check for duplicate emails", async () => {
    // make suer we can register an user
    const response: any = await request(getHost(), mutation(email, password));
    expect(response).toEqual({ register: null });
    const users = await User.find({ where: { email } });
    expect(users).toHaveLength(1);
    const user = users[0];
    expect(user.email).toEqual(email);
    expect(user.password).not.toEqual(password);

    const response2: any = await request(getHost(), mutation(email, password));
    expect(response2.register).toHaveLength(1);
    expect(response2.register[0]).toEqual({
      path: "email",
      message: duplicateEmail,
    });
  });

  it("check bad email", async () => {
    const response3: any = await request(getHost(), mutation("b", password));
    expect(response3).toEqual({
      register: [
        {
          path: "email",
          message: emailNotLongEnough
        },
        {
          path: "email",
          message: invalidEmail
        }
      ],
    });
  });

  it("check bad password", async () => {
    const response4: any = await request(getHost(), mutation(email, "ad"));
    expect(response4).toEqual({
      register: [
        {
          path: "password",
          message: passwordNotLongEnough
        }
      ],
    });
  });

  it("check bad password and bad email", async () => {
    const response5: any = await request(getHost(), mutation("df", "ad"));
    expect(response5).toEqual({
      register: [
        {
          path: "email",
          message: emailNotLongEnough
        },
        {
          path: "email",
          message: invalidEmail
        },
        {
          path: "password",
          message: passwordNotLongEnough
        }
      ],
    });
  });
});

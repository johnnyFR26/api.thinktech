import { describe, before, after, it } from "node:test";
import assert from "node:assert";
import { server } from "../index";

describe("API WORKFLOW", () => {
  let _server: any
  let _account: any
  let _category: any

  before(async () => {
    _server = await server.listen({ port: 3000 });
  });

  after(async () => {
    await _server.close();
  });

  it("Base url returns 'Server running'", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/",
    });

    assert.strictEqual(response.statusCode, 200, "server doe not return 200");
    assert.strictEqual(response.body, "Server running", "api does not return 'Server running'.");
  });

  it("Create user", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/users",
      body: {
        name: "John Doe",
        email: "johnny-teste@example.com",
        password: "secret",
        cpf: "12345678901",
        phone: "12345678901"
      }
    });
    assert.strictEqual(response.statusCode, 201, "server does not return 201");
  });

  it("login user", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/auth/login",
      body: {
        email: "johnny-teste@example.com",
        password: "secret"
      }
    });
    assert.strictEqual(response.statusCode, 200, "server does not return 200");
      })

      it('Update user', async () => {
        const response = await server.inject({
            method: "PUT",
            url: "/users/johnny-teste@example.com",
            body: {
                name: "John Doe Updated",
            }
        })
        assert.strictEqual(response.statusCode, 200, "server does not return 200");
      });

      it('Create account to user', async () => {
        const response = await server.inject({
            method: "POST",
            url: "/accounts/johnny-teste@example.com",
            body: {
                currentValue: 1000.67,
                currency: "BRL",
            }
        })
        _account = JSON.parse(response.body)
        assert.strictEqual(response.statusCode, 201, "server does not return 201");
      });

      it('Create category', async () => {
        const response = await server.inject({
          method: "POST",
          url: "/category",
          body:{
            name: "Receita federal",
            accountId: _account.id,
          }
        })
        _category = JSON.parse(response.body)
        assert.strictEqual(response.statusCode, 201, "Does not create category")
      })

      it('make a transaction +', async() => {
        const response = await server.inject({
            method: "POST",
            url: "/transactions",
            body: {
                type: "input",
                destination: "johnny-teste@example.com",
                value: 1000.67,
                description: "Test transaction",
                accountId: _account.id,
                categoryId: _category.id
            }
        })
        assert.strictEqual(response.statusCode, 201, "server does not return 201");
      })

      it('make a transaction -', async() => {
        const response = await server.inject({
            method: "POST",
            url: "/transactions",
            body: {
                type: "output",
                destination: "johnny-teste@example.com",
                value: 120.67,
                description: "Test transaction",
                accountId: _account.id,
                categoryId: _category.id
            }
        })
        assert.strictEqual(response.statusCode, 201, "server does not return 201");
      })
      
      

  it("Delete user", async () => {
    const response = await server.inject({
      method: "DELETE",
      url: "/users/johnny-teste@example.com",
    });
    assert.strictEqual(response.statusCode, 200, "server does not return 200");
  });

  it('Get all users', async () => {
    const response = await server.inject({
      method: "GET",
      url: "/users",
    });
    assert.strictEqual(response.statusCode, 200, "server does not return 200");
    assert.equal(Array.isArray(JSON.parse(response.body)), true, "response is not an array");
  });  
});

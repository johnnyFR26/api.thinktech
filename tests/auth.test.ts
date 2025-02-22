import {describe, before, it, after } from "node:test";
import assert from "node:assert";
import { server } from "../index";

describe("AUTH WORKFLOW", () => {
    let _server: any;

    before(async () => {
        _server = await server.listen({ port: 3000 });
    });

    after(async () => {
        await _server.close();
    });

    it("Login successful", async () => {
        const response = await server.inject({
            method: "POST",
            url: "/auth/login",
            body: {
                email: "john@example.com",
                password: "secret"
            }
        });

        assert.strictEqual(response.statusCode, 200, "server does not return 200");
        assert.strictEqual(JSON.parse(response.body).token, "token", "api does not return 'token'.");
    });

    it("Login failed", async () => {
        const response = await server.inject({
            method: "POST",
            url: "/auth/login",
            body: {
                email: "john@example.com",
                password: "wrong-password"
            }
        });

        assert.strictEqual(response.statusCode, 401, "server does not return 401");
        assert.strictEqual(JSON.parse(response.body).error, "Unauthorized", "api does not return 'Unauthorized'.");
    });
})
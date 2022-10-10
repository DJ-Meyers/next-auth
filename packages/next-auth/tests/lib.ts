import { createHash } from "crypto"
import { AuthHandler } from "../src/core"
import type { LoggerInstance, NextAuthOptions } from "../src"
import type { Adapter } from "../src/adapters"

export function mockLogger(): Record<keyof LoggerInstance, jest.Mock> {
  return {
    error: jest.fn(() => {}),
    warn: jest.fn(() => {}),
    debug: jest.fn(() => {}),
  }
}

interface HandlerOptions {
  prod?: boolean
  path?: string
  params?: URLSearchParams | Record<string, string>
  requestInit?: RequestInit
}

export async function handler(
  options: NextAuthOptions,
  { prod, path, params, requestInit }: HandlerOptions
) {
  // @ts-expect-error
  if (prod) process.env.NODE_ENV = "production"

  const url = new URL(
    `http://localhost/api/auth/${path ?? "signin"}?${new URLSearchParams(
      params ?? {}
    )}`
  )
  const req = new Request(url, { headers: { host: "" }, ...requestInit })
  const logger = mockLogger()
  const response = await AuthHandler(req, {
    secret: "secret",
    ...options,
    logger,
  })
  // @ts-expect-error
  if (prod) process.env.NODE_ENV = "test"

  return {
    res: {
      status: response.status,
      headers: response.headers,
      body: response.body,
      redirect: response.headers.get("location"),
      html:
        response.headers?.get("content-type") === "text/html"
          ? await response.clone().text()
          : undefined,
    },
    log: logger,
  }
}

export function createCSRF() {
  const secret = "secret"
  const value = "csrf"
  const token = createHash("sha256").update(`${value}${secret}`).digest("hex")

  return {
    secret,
    csrf: { value, token, cookie: `next-auth.csrf-token=${value}|${token}` },
  }
}

export function mockAdapter(): Adapter {
  const adapter: Adapter = {
    createVerificationToken: jest.fn(() => {}),
    useVerificationToken: jest.fn(() => {}),
    getUserByEmail: jest.fn(() => {}),
  } as unknown as Adapter
  return adapter
}

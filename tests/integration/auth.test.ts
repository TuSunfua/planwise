import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { randomBytes, randomInt } from "node:crypto";
import { createServer } from "node:net";
import { after, before, describe, test } from "node:test";

import pg from "pg";

// These start the production build (next start) on a fresh Postgres database and use it as a browser without
// JavaScript would: real forms, real DAL, real database.

const ADMIN_URL = "postgres://planwise:planwise@127.0.0.1:54321/postgres";
const START_TIMEOUT_MS = 90_000;
const READY = /Ready in/;

interface Page {
  status: number;
  html: string;
  location: string | null;
  setCookie: string[];
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === "object") resolve(address.port);
        else reject(new Error("No free port"));
      });
    });
  });
}

// The caller waits for output, never for a fixed time.
function waitFor(output: () => string, changed: Set<() => void>, pattern: RegExp): Promise<RegExpExecArray> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      changed.delete(check);
      reject(new Error(`No ${String(pattern)} in the server's output:\n${output().slice(-2000)}`));
    }, START_TIMEOUT_MS);
    const check = () => {
      const match = pattern.exec(output());
      if (!match) return;
      clearTimeout(timer);
      changed.delete(check);
      resolve(match);
    };
    changed.add(check);
    check();
  });
}

async function startServer(vars: { APP_ENV: string; scheme: "http" | "https" }) {
  const port = await freePort();
  const origin = `http://127.0.0.1:${port}`;
  const changed = new Set<() => void>();
  let output = "";

  const child: ChildProcess = spawn("node_modules/.bin/next", ["start", "--port", String(port), "-H", "127.0.0.1"], {
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      APP_ENV: vars.APP_ENV,
      APP_URL: `${vars.scheme}://127.0.0.1:${port}`,
      AUTH_SECRET: randomBytes(32).toString("base64url"),
      DATABASE_URL: databaseUrl,
    },
  });
  const collect = (chunk: Buffer) => {
    output += chunk.toString().replace(/\u001b\[[0-9;]*m/g, "");
    changed.forEach((check) => check());
  };
  child.stdout?.on("data", collect);
  child.stderr?.on("data", collect);
  await waitFor(() => output, changed, READY);

  return {
    origin,
    output: () => output,
    waitForOutput: (pattern: RegExp) => waitFor(() => output, changed, pattern),
    async stop() {
      if (child.exitCode !== null || child.pid === undefined) return;
      const exited = new Promise((resolve) => child.once("exit", resolve));
      process.kill(-child.pid, "SIGTERM");
      await exited;
    },
  };
}

type Server = Awaited<ReturnType<typeof startServer>>;

// assert.match would print the whole page when it fails.
function shows(html: string, pattern: RegExp): void {
  assert.ok(pattern.test(html), `The page doesn't show ${String(pattern)}`);
}

function decode(value: string): string {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

class Browser {
  readonly ip = `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
  readonly cookies = new Map<string, string>();
  server: Server;
  path = "/sign-in";
  page: Page = { status: 0, html: "", location: null, setCookie: [] };

  constructor(server: Server) {
    this.server = server;
  }

  async send(path: string, init: RequestInit = {}): Promise<Page> {
    const headers = new Headers(init.headers);
    headers.set("x-forwarded-for", this.ip); // set by Vercel in production
    headers.set("accept", "text/html");
    if (this.cookies.size > 0) headers.set("cookie", [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "));

    const response = await fetch(`${this.server.origin}${path}`, { ...init, headers, redirect: "manual" });
    const setCookie = response.headers.getSetCookie();
    for (const line of setCookie) {
      const [pair = ""] = line.split(";");
      const at = pair.indexOf("=");
      if (/max-age=0(;|$)/i.test(line)) this.cookies.delete(pair.slice(0, at));
      else this.cookies.set(pair.slice(0, at), pair.slice(at + 1));
    }
    return {
      status: response.status,
      html: await response.text(),
      location: response.headers.get("location"),
      setCookie,
    };
  }

  async open(path: string): Promise<Page> {
    this.path = path;
    this.page = await this.send(path);
    return this.page;
  }

  // Posts the form that has this marker, with the hidden fields the server rendered into it.
  post(
    marker: string,
    fields: Record<string, string>,
    origin = this.server.origin,
    html = this.page.html,
    extraHeaders: Record<string, string> = {},
  ) {
    const form = [...html.matchAll(/<form[\s\S]*?<\/form>/g)].map((m) => m[0]).find((f) => f.includes(marker));
    assert.ok(form, `No form with ${marker}`);

    const body = new FormData();
    for (const [input] of form.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
      const name = /name="([^"]*)"/.exec(input)?.[1];
      if (name) body.set(decode(name), decode(/value="([^"]*)"/.exec(input)?.[1] ?? ""));
    }
    for (const [name, value] of Object.entries(fields)) body.set(name, value);
    return this.send(this.path, { method: "POST", body, headers: { origin, ...extraHeaders } });
  }

  async submit(intent: string, fields: Record<string, string> = {}): Promise<Page> {
    this.page = await this.post('name="intent"', { intent, ...fields });
    return this.page;
  }
}

let server: Server;
let databaseUrl: string;
let database: pg.Pool;
let counter = 0;
const databaseName = `planwise_test_${randomBytes(4).toString("hex")}`;

const newEmail = () => `person-${++counter}-${randomBytes(3).toString("hex")}@example.com`;

// Takes "?" placeholders, like the queries below.
async function rows<T>(query: string, ...values: (string | number | Date)[]): Promise<T[]> {
  let index = 0;
  const { rows: result } = await database.query(
    query.replace(/\?/g, () => `$${++index}`),
    values,
  );
  return result as T[];
}

async function count(query: string, ...values: (string | number | Date)[]): Promise<number> {
  return Number((await rows<{ n: number | string }>(query, ...values))[0]?.n ?? 0);
}

const sessionCount = (email: string) =>
  count("SELECT count(*) n FROM sessions s JOIN users u ON u.id = s.user_id WHERE u.email = ?", email.toLowerCase());

const codesSent = (email: string) =>
  [...server.output().matchAll(new RegExp(`Sign-in code for ${email.toLowerCase()}: (\\d{6})`, "g"))].map(
    (match) => match[1] ?? "",
  );

// Each test gets its own IP and address, so one test's limits never reach another.
async function askForCode(email: string, browser = new Browser(server)) {
  const sentBefore = codesSent(email).length;
  await browser.open("/sign-in");
  const page = await browser.submit("request", { email });
  assert.equal(page.status, 200);
  shows(page.html, /Check your email/);
  await server.waitForOutput(
    new RegExp(`(Sign-in code for ${email.toLowerCase()}: \\d{6}[\\s\\S]*?){${sentBefore + 1}}`),
  );
  return { browser, code: codesSent(email).at(-1) ?? "" };
}

async function signIn(email = newEmail()) {
  const { browser, code } = await askForCode(email);
  const page = await browser.submit("verify", { code });
  assert.equal(page.status, 303);
  assert.equal(page.location?.endsWith("/inbox"), true);
  return { browser, email, code, page };
}

const wrongCode = (code: string, offset = 1) => String((Number(code) + offset) % 1_000_000).padStart(6, "0");

async function seesInbox(browser: Browser): Promise<boolean> {
  return (await browser.open("/inbox")).html.includes("Your Inbox is ready");
}

async function admin(query: string): Promise<void> {
  const client = new pg.Client({ connectionString: ADMIN_URL });
  await client.connect();
  try {
    await client.query(query);
  } finally {
    await client.end();
  }
}

before(async () => {
  await admin(`CREATE DATABASE ${databaseName}`);
  databaseUrl = ADMIN_URL.replace(/\/postgres$/, `/${databaseName}`);
  const env = { ...process.env, DATABASE_URL: databaseUrl };
  execFileSync("node_modules/.bin/drizzle-kit", ["migrate"], { stdio: "pipe", env });
  database = new pg.Pool({ connectionString: databaseUrl, max: 4 });
  server = await startServer({ APP_ENV: "local", scheme: "http" });
});

after(async () => {
  await database.end();
  await server.stop();
  await admin(`DROP DATABASE IF EXISTS ${databaseName} WITH (FORCE)`);
});

void describe("signing in (AUTH-01)", () => {
  void test("a form posted before hydration gets a whole page back", async () => {
    const browser = new Browser(server);
    await browser.open("/sign-in");
    const page = await browser.submit("request", { email: newEmail() });

    shows(page.html, /<html/);
    shows(page.html, /Check your email/);
  });

  void test("a new person signs up with a code and reaches their Inbox", async () => {
    const { browser, email, page } = await signIn();

    const cookie = page.setCookie.find((line) => line.includes("session_token=")) ?? "";
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Lax/i);
    assert.equal(await seesInbox(browser), true);
    assert.equal(await count("SELECT count(*) n FROM users WHERE email = ? AND is_email_verified", email), 1);
  });

  void test("signing in again reuses the account, whatever the letter case", async () => {
    const { email } = await signIn();
    await signIn(email.toUpperCase());

    assert.equal(await count("SELECT count(*) n FROM users WHERE lower(email) = ?", email), 1);
    assert.equal(await sessionCount(email), 2);
  });

  void test("a code works only once", async () => {
    const email = newEmail();
    const { browser, code } = await askForCode(email);
    const codePage = browser.page.html;
    assert.equal((await browser.submit("verify", { code })).status, 303);

    const again = new Browser(server);
    const replay = await again.post('name="intent"', { intent: "verify", code }, server.origin, codePage);
    shows(replay.html, /wrong or has expired/);
    assert.equal(await sessionCount(email), 1);
  });

  void test("an expired code is refused", async () => {
    const email = newEmail();
    const { browser, code } = await askForCode(email);
    await rows(
      "UPDATE verifications SET expires_at = ? WHERE identifier LIKE ?",
      new Date(Date.now() - 1000),
      `%${email}`,
    );

    shows((await browser.submit("verify", { code })).html, /wrong or has expired/);
    assert.equal(await sessionCount(email), 0);
  });

  void test("a code expires 10 minutes after it is sent", async () => {
    const email = newEmail();
    await askForCode(email);
    const [row] = await rows<{ life: number }>(
      "SELECT extract(epoch FROM expires_at - created_at) * 1000 life FROM verifications WHERE identifier = ?",
      `sign-in-otp-${email}`,
    );
    assert.ok(row && Math.abs(Number(row.life) - 600_000) < 2000);
  });

  void test("four wrong codes still leave the fifth try", async () => {
    const { browser, code } = await askForCode(newEmail());
    for (let i = 1; i <= 4; i++) await browser.submit("verify", { code: wrongCode(code, i) });

    assert.equal((await browser.submit("verify", { code })).status, 303);
  });

  void test("five wrong codes use up the attempts, even for the right one", async () => {
    const email = newEmail();
    const { browser, code } = await askForCode(email);
    for (let i = 1; i <= 5; i++) await browser.submit("verify", { code: wrongCode(code, i) });

    shows((await browser.submit("verify", { code })).html, /too many tries/);
    assert.equal(await sessionCount(email), 0);
  });

  void test("parallel guesses from many IPs can't get past five attempts", async () => {
    const email = newEmail();
    const { browser, code } = await askForCode(email);
    const html = browser.page.html;
    const guess = (guessed: string) =>
      new Browser(server).post('name="intent"', { intent: "verify", code: guessed }, server.origin, html);

    // Each round uses at least one attempt, however its guesses interleave.
    for (let round = 0; round < 6; round++) {
      await Promise.all(Array.from({ length: 10 }, (_, i) => guess(wrongCode(code, round * 10 + i + 1))));
    }

    assert.notEqual((await guess(code)).status, 303);
    assert.equal(await sessionCount(email), 0);
  });

  void test("the right code sent ten times at once creates one session", async () => {
    const email = newEmail();
    const { browser, code } = await askForCode(email);
    const html = browser.page.html;
    const pages = await Promise.all(
      Array.from({ length: 10 }, () =>
        new Browser(server).post('name="intent"', { intent: "verify", code }, server.origin, html),
      ),
    );

    assert.equal(pages.filter((page) => page.status === 303).length, 1);
    assert.deepEqual([...new Set(pages.map((page) => page.status))].sort(), [200, 303]);
    assert.equal(await sessionCount(email), 1);
  });

  void test("sending again replaces the code", async () => {
    const email = newEmail();
    const { browser, code: first } = await askForCode(email);
    assert.equal((await browser.submit("resend")).status, 200);
    await server.waitForOutput(new RegExp(`(Sign-in code for ${email}: \\d{6}[\\s\\S]*?){2}`));
    const second = codesSent(email).at(-1) ?? "";

    assert.equal(await count("SELECT count(*) n FROM verifications WHERE identifier = ?", `sign-in-otp-${email}`), 1);
    if (first !== second) shows((await browser.submit("verify", { code: first })).html, /wrong or has expired/);
    assert.equal((await browser.submit("verify", { code: second })).status, 303);
  });

  void test("sends at the same moment end in one live code, never an error", async () => {
    const email = newEmail();
    const opener = new Browser(server);
    const { html } = await opener.open("/sign-in");
    const pages = await Promise.all(
      Array.from({ length: 3 }, () =>
        new Browser(server).post('name="intent"', { intent: "request", email }, server.origin, html),
      ),
    );

    assert.deepEqual(
      pages.map((page) => page.status),
      [200, 200, 200],
    );
    assert.equal(await count("SELECT count(*) n FROM verifications WHERE identifier = ?", `sign-in-otp-${email}`), 1);
  });

  void test("codes are stored as keyed hashes", async () => {
    const email = newEmail();
    const { code } = await askForCode(email);
    const [row] = await rows<{ value: string }>(
      "SELECT value FROM verifications WHERE identifier = ?",
      `sign-in-otp-${email}`,
    );

    assert.match(row?.value ?? "", /^[0-9a-f]{64}:0$/);
    const plain = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
    assert.notEqual(row?.value, `${Buffer.from(plain).toString("hex")}:0`);
  });

  void test("a code with a space pasted into it works", async () => {
    const { browser, code } = await askForCode(newEmail());
    assert.equal((await browser.submit("verify", { code: `${code.slice(0, 3)} ${code.slice(3)}` })).status, 303);
  });

  void test("the answer doesn't reveal whether an account exists", async () => {
    const { email } = await signIn();
    const existing = (await askForCode(email)).browser.page;
    const unknown = newEmail();
    const fresh = (await askForCode(unknown)).browser.page;
    const visible = (html: string) => /<main[\s\S]*?<\/main>/.exec(html)?.[0].replace(/<[^>]*>/g, "");

    assert.equal(visible(existing.html)?.replace(email, "X"), visible(fresh.html)?.replace(unknown, "X"));
  });
});

void describe("input", () => {
  for (const [name, email] of [
    ["empty", ""],
    ["not an address", "hello"],
    ["look-alike letters", "Kim@example.com"],
    ["full-width at sign", "a＠example.com"],
    ["too long", `${"a".repeat(250)}@example.com`],
    ["two addresses", "a@example.com,b@example.com"],
    ["a line break inside", "a@example.com\nBcc:b@example.com"],
  ] as const) {
    void test(`refuses an email that is ${name}`, async () => {
      const browser = new Browser(server);
      await browser.open("/sign-in");
      const page = await browser.submit("request", { email });

      assert.equal(page.status, 200);
      shows(page.html, /Enter an email address like/);
    });
  }

  for (const code of ["", "12345", "1234567", "abcdef", "1".repeat(500)]) {
    void test(`refuses the code "${code.slice(0, 10)}" without using an attempt`, async () => {
      const email = newEmail();
      const { browser } = await askForCode(email);

      shows((await browser.submit("verify", { code })).html, /Enter all 6 digits/);
      const [row] = await rows<{ value: string }>(
        "SELECT value FROM verifications WHERE identifier = ?",
        `sign-in-otp-${email}`,
      );
      assert.match(row?.value ?? "", /:0$/);
    });
  }

  void test("an unknown intent is an error message, not a 500", async () => {
    const browser = new Browser(server);
    await browser.open("/sign-in");
    const page = await browser.submit("delete-everything", { email: newEmail() });

    assert.equal(page.status, 200);
    shows(page.html, /That didn(&#x27;|')t work/);
  });
});

void describe("limits", () => {
  void test("three codes an hour for one address, from any IP", async () => {
    const email = newEmail();
    for (let i = 0; i < 3; i++) await askForCode(email);
    const browser = new Browser(server);
    await browser.open("/sign-in");

    shows((await browser.submit("request", { email })).html, /Too many tries/);
  });

  void test("ten codes an hour for one IP, and a blocked IP can't use up someone's address", async () => {
    const browser = new Browser(server);
    for (let i = 0; i < 10; i++) await askForCode(newEmail(), browser);
    const victim = newEmail();
    for (let i = 0; i < 4; i++) {
      await browser.open("/sign-in");
      shows((await browser.submit("request", { email: victim })).html, /Too many tries/);
    }

    await askForCode(victim);
  });

  void test("thirty tries an hour for one IP", async () => {
    const { browser } = await askForCode(newEmail());
    for (let i = 0; i < 30; i++) await browser.submit("verify", { code: "000000" });

    shows((await browser.submit("verify", { code: "000000" })).html, /Too many tries/);
  });

  void test("parallel sends from one IP stop at exactly its limit", async () => {
    const opener = new Browser(server);
    const { html } = await opener.open("/sign-in");
    const pages = await Promise.all(
      Array.from({ length: 16 }, () =>
        opener.post('name="intent"', { intent: "request", email: newEmail() }, server.origin, html),
      ),
    );

    assert.equal(pages.filter((page) => /Check your email/.test(page.html)).length, 10);
  });

  for (const [name, dayOf, sent] of [
    ["day", (today: string) => today, 100],
    ["month", (today: string) => `${today.slice(0, 7)}-01`, 3000],
  ] as const) {
    void test(`stops at the email budget of the ${name}`, async () => {
      const day = dayOf(new Date().toISOString().slice(0, 10));
      const [saved] = await rows<{ count: number }>("SELECT count FROM email_usage WHERE day = ?", day);
      await rows(
        `INSERT INTO email_usage (day, purpose, count, created_at, updated_at) VALUES (?, 'sign_in', ?, now(), now())
         ON CONFLICT (day, purpose) DO UPDATE SET count = excluded.count`,
        day,
        sent,
      );
      try {
        const browser = new Browser(server);
        await browser.open("/sign-in");
        shows((await browser.submit("request", { email: newEmail() })).html, /available right now/);
      } finally {
        await rows("UPDATE email_usage SET count = ? WHERE day = ?", saved?.count ?? 0, day);
      }
    });
  }

  void test("parallel sends never pass the day's email budget", async () => {
    const day = new Date().toISOString().slice(0, 10);
    const [saved] = await rows<{ count: number }>("SELECT count FROM email_usage WHERE day = ?", day);
    await rows(
      `INSERT INTO email_usage (day, purpose, count, created_at, updated_at) VALUES (?, 'sign_in', 95, now(), now())
       ON CONFLICT (day, purpose) DO UPDATE SET count = 95`,
      day,
    );
    try {
      const { html } = await new Browser(server).open("/sign-in");
      await Promise.all(
        Array.from({ length: 12 }, () =>
          new Browser(server).post('name="intent"', { intent: "request", email: newEmail() }, server.origin, html),
        ),
      );
      assert.equal(await count("SELECT count n FROM email_usage WHERE day = ?", day), 100);
    } finally {
      await rows("UPDATE email_usage SET count = ? WHERE day = ?", saved?.count ?? 0, day);
    }
  });
});

void describe("sessions (AUTH-03)", () => {
  void test("signing out revokes this session on its next request", async () => {
    const { browser, email } = await signIn();
    const copy = new Map(browser.cookies);
    await browser.open("/inbox");
    const page = await browser.post(">Sign out</button>", {});

    assert.equal(page.status, 303);
    assert.equal(await sessionCount(email), 0);
    const thief = new Browser(server);
    copy.forEach((value, key) => thief.cookies.set(key, value));
    assert.equal(await seesInbox(thief), false);
  });

  void test("signing out leaves the person's other devices signed in", async () => {
    const first = await signIn();
    const second = await signIn(first.email);
    await first.browser.open("/inbox");
    await first.browser.post(">Sign out</button>", {});

    assert.equal(await seesInbox(second.browser), true);
  });

  void test("signing out on all devices revokes every session", async () => {
    const first = await signIn();
    const second = await signIn(first.email);
    const other = await signIn();
    await first.browser.open("/inbox");
    assert.equal((await first.browser.post("Sign out on all devices", {})).status, 303);

    assert.equal(await sessionCount(first.email), 0);
    assert.equal(await seesInbox(second.browser), false);
    assert.equal(await seesInbox(other.browser), true);
  });

  void test("an expired session is refused", async () => {
    const { browser, email } = await signIn();
    await rows(
      "UPDATE sessions SET expires_at = ? WHERE user_id = (SELECT id FROM users WHERE email = ?)",
      new Date(Date.now() - 1000),
      email,
    );

    assert.equal(await seesInbox(browser), false);
  });

  for (const [name, cookie] of [
    ["no cookie", null],
    ["an unsigned cookie", "made-up"],
    ["a badly signed cookie", "made-up.c2lnbmF0dXJl"],
  ] as const) {
    void test(`signed out with ${name} gets no Inbox`, async () => {
      const browser = new Browser(server);
      if (cookie) browser.cookies.set("better-auth.session_token", cookie);
      const page = await browser.open("/inbox");

      assert.ok(page.status < 400);
      assert.ok(!/Your Inbox is ready/.test(page.html));
      shows(page.html + (page.location ?? ""), /sign-in/);
    });
  }

  void test("signed out leaves for sign-in by a page load, never a redirect the router would replay", async () => {
    const page = await new Browser(server).open("/inbox");

    assert.ok(!page.html.includes("NEXT_REDIRECT"));
    shows(page.html, /href="\/sign-in"/);
  });

  void test("a real session token without its signature is refused", async () => {
    const { email } = await signIn();
    const [row] = await rows<{ token: string }>(
      "SELECT token FROM sessions WHERE user_id = (SELECT id FROM users WHERE email = ?)",
      email,
    );
    const browser = new Browser(server);
    browser.cookies.set("better-auth.session_token", row?.token ?? "");

    assert.equal(await seesInbox(browser), false);
  });

  void test("the home page's button takes someone signed in to the Inbox", async () => {
    const { browser } = await signIn();
    shows((await browser.open("/")).html, /href="\/inbox"/);
    assert.equal(await seesInbox(browser), true);
  });
});

void describe("the Inbox (AUTH-05)", () => {
  void test("repeated and parallel sign-ins still leave exactly one, with one owner", async () => {
    const { email } = await signIn();
    await signIn(email);

    const projects = await rows<{ role: string }>(
      `SELECT m.role FROM projects p JOIN project_members m ON m.project_id = p.id
       JOIN users u ON u.id = p.created_by WHERE u.email = ? AND p.kind = 'inbox'`,
      email,
    );
    assert.deepEqual(
      projects.map((row) => row.role),
      ["owner"],
    );
  });

  void test("an Inbox that failed at sign-up appears at the next sign-in", async () => {
    const { email } = await signIn();
    await rows("DELETE FROM projects WHERE created_by = (SELECT id FROM users WHERE email = ?)", email);

    assert.equal(await seesInbox((await signIn(email)).browser), true);
  });

  void test("a non-member is denied, even the person who created it", async () => {
    const { browser, email } = await signIn();
    await rows("DELETE FROM project_members WHERE user_id = (SELECT id FROM users WHERE email = ?)", email);

    const page = await browser.open("/inbox");
    assert.ok(!/Your Inbox is ready/.test(page.html));
    shows(page.html, /Page not found|NEXT_HTTP_ERROR_FALLBACK;404/);
  });

  void test("two people never see each other's account or Inbox", async () => {
    const [a, b] = [await signIn(), await signIn()];
    const pages = await Promise.all(
      Array.from({ length: 30 }, async (_, i) => {
        const who = i % 2 ? a : b;
        const { html } = await who.browser.send("/inbox");
        return { who, html };
      }),
    );

    for (const { who, html } of pages) {
      assert.ok(html.includes(who.email));
      assert.ok(!html.includes(who === a ? b.email : a.email));
    }
  });
});

void describe("the surface", () => {
  for (const path of [
    "/api/auth/email-otp/send-verification-otp",
    "/api/auth/sign-in/email-otp",
    "/api/auth/get-session",
  ]) {
    void test(`${path} doesn't exist`, async () => {
      const init = { method: "POST", body: "{}", headers: { "content-type": "application/json" } };
      const page = await new Browser(server).send(path, init);

      assert.ok(page.status === 404 || page.status === 405, `got ${page.status}`);
      assert.deepEqual(page.setCookie, []);
    });
  }

  void test("a sign-in posted from another site changes nothing", async () => {
    const email = newEmail();
    const { browser, code } = await askForCode(email);
    const page = await browser.post('name="intent"', { intent: "verify", code }, "https://attacker.example");

    assert.notEqual(page.status, 303);
    assert.equal(await sessionCount(email), 0);
  });

  for (const path of ["/", "/sign-in", "/inbox"]) {
    void test(`${path} works with a cookie and sends the security headers`, async () => {
      const response = await fetch(`${server.origin}${path}`, {
        headers: { cookie: "theme=dark" },
        redirect: "manual",
      });

      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
      assert.equal(response.headers.get("x-content-type-options"), "nosniff");
      assert.ok(response.headers.get("strict-transport-security"));
      await response.text();
    });
  }

  void test("logs hold no email outside the local code printout", () => {
    const logs = server.output().replace(/Sign-in code for [^\n]+/g, "");
    assert.doesNotMatch(logs, /@example\.com/);
  });

  void test("the server logged no unexpected error", () => {
    const errors = server
      .output()
      .split("\n")
      .filter((line) => /Failed query|"level":"error"|⨯|Unhandled/.test(line))
      // Next.js refusing the cross-site posts above is the expected outcome.
      .filter((line) => !line.includes("Invalid Server Actions request"));
    assert.deepEqual(errors, []);
  });
});

void describe("without an email sender", () => {
  for (const [name, vars] of [
    ["not marked local", { APP_ENV: "production", scheme: "http" }],
    ["marked local by mistake on https", { APP_ENV: "local", scheme: "https" }],
  ] as const) {
    void test(`a deployment ${name} refuses instead of printing the code`, async () => {
      const deployed = await startServer(vars);
      try {
        const email = newEmail();
        const browser = new Browser(deployed);
        await browser.open("/sign-in");
        shows((await browser.submit("request", { email })).html, /available right now/);
        assert.doesNotMatch(deployed.output(), /Sign-in code for/);
      } finally {
        await deployed.stop();
      }
    });
  }
});

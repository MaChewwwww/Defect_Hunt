import { expect, test } from "@playwright/test";
import { resetSandboxAndSignIn } from "../helpers";

test.describe("Auth, Session, Access Control & Users (VH-01 to VH-14)", () => {
  test("T-VH-01 (VH-01): Leading/trailing space in login email is rejected", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.locator("#login-email").fill(" admin@verandapms.test ");
    await page.locator("#login-password").fill("Admin@123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByTestId("login-error")).toContainText(
      "Invalid email or password."
    );
  });

  test("T-VH-02 (VH-02): Enter in Password does nothing; Enter in Email submits", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.locator("#login-email").fill("admin@verandapms.test");
    await page.locator("#login-password").fill("Admin@123");
    await page.locator("#login-password").focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/login/);

    await page.locator("#login-email").focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("T-VH-03 (VH-03): Distinct error messages enable account enumeration", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.locator("#login-email").fill("nobody@verandapms.test");
    await page.locator("#login-password").fill("Anything123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByTestId("login-error")).toHaveText(
      "Invalid email or password."
    );

    await page.locator("#login-email").fill("admin@verandapms.test");
    await page.locator("#login-password").fill("WrongPassword");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByTestId("login-error")).toHaveText(
      "Incorrect email or password."
    );
  });

  test("T-VH-04 (VH-04): Lockout message displays after 5 failures but valid password still logs in", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Reset demo data" }).click();
    for (let i = 0; i < 5; i++) {
      await page.locator("#login-email").fill("admin@verandapms.test");
      await page.locator("#login-password").fill("WrongPassword");
      await page.getByRole("button", { name: "Sign in" }).click();
    }
    await expect(page.getByTestId("login-error")).toHaveText(
      "Too many attempts, try again later."
    );

    await page.locator("#login-password").fill("Admin@123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("T-VH-05 (VH-05): Register ignores password mismatch for 12+ character passwords", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.locator("#reg-name").fill("Short Mismatch");
    await page.locator("#reg-email").fill("short@verandapms.test");
    await page.locator("#reg-password").fill("Password1");
    await page.locator("#reg-confirm").fill("Password2");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByTestId("register-error")).toHaveText(
      "Passwords do not match."
    );

    await page.locator("#reg-name").fill("Long Mismatch");
    await page.locator("#reg-email").fill("long@verandapms.test");
    await page.locator("#reg-password").fill("LongPassword12");
    await page.locator("#reg-confirm").fill("Different12345");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("T-VH-06 (VH-06): Register email uniqueness check is case-sensitive", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.locator("#reg-name").fill("Dup Exact");
    await page.locator("#reg-email").fill("admin@verandapms.test");
    await page.locator("#reg-password").fill("Secret123");
    await page.locator("#reg-confirm").fill("Secret123");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByTestId("register-error")).toContainText(
      "already exists"
    );

    await page.locator("#reg-email").fill("Admin@verandapms.test");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("T-VH-07 (VH-07): Password reset link is reusable multiple times", async ({
    page,
  }) => {
    await page.goto("/forgot-password");
    await page.locator("#fp-email").fill("staff@verandapms.test");
    await page.getByRole("button", { name: "Send reset link" }).click();
    const link = page.getByRole("link", { name: "Open reset link" });
    await expect(link).toBeVisible();
    const resetHref = await link.getAttribute("href");
    expect(resetHref).toBeTruthy();

    await page.goto(resetHref!);
    await page.locator("#rp-pass").fill("FirstNew123");
    await page.locator("#rp-confirm").fill("FirstNew123");
    await page.getByRole("button", { name: "Set new password" }).click();
    await expect(page.getByTestId("reset-success")).toBeVisible();

    // Revisit same copied reset link
    await page.goto(resetHref!);
    await page.locator("#rp-pass").fill("SecondNew123");
    await page.locator("#rp-confirm").fill("SecondNew123");
    await page.getByRole("button", { name: "Set new password" }).click();
    await expect(page.getByTestId("reset-success")).toBeVisible();
  });

  test("T-VH-08 (VH-08): Session persists in localStorage even when Remember me is unchecked", async ({
    page,
    context,
  }) => {
    await resetSandboxAndSignIn(page, "staff@verandapms.test", "Staff@123");
    const stored = await page.evaluate(() =>
      window.localStorage.getItem("veranda.v1.session")
    );
    expect(stored).toContain("staff@verandapms.test");

    const tab2 = await context.newPage();
    await tab2.goto("/dashboard");
    await expect(tab2).toHaveURL(/\/dashboard/);
  });

  test("T-VH-09 (VH-09): Deactivated account blocked unchecked but logs in with Remember me ticked", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.locator("#login-email").fill("former@verandapms.test");
    await page.locator("#login-password").fill("Former@123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByTestId("login-error")).toContainText("deactivated");

    await page.getByLabel("Remember me").check();
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("T-VH-10 (VH-10): Staff can open /users directly via URL even though sidebar hides it", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page, "staff@verandapms.test", "Staff@123");
    await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);

    await page.goto("/users");
    await expect(page.getByTestId("user-row-admin@verandapms.test")).toBeVisible();
  });

  test("T-VH-11 (VH-11): Staff sees Delete on /rooms/[id] detail page and can delete", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page, "staff@verandapms.test", "Staff@123");
    await page.goto("/rooms");
    await expect(page.getByTestId("delete-room-SB-1001")).toHaveCount(0);

    await page.goto("/rooms/rm-1001");
    await expect(page.getByTestId("room-detail-delete")).toBeVisible();
    await page.getByTestId("room-detail-delete").click();
    await expect(page).toHaveURL(/\/rooms$/);
    await expect(page.getByTestId("room-row-SB-1001")).toHaveCount(0);
  });

  test("T-VH-12 (VH-12): Admin can deactivate own account in /users and is signed out on reload", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page, "admin@verandapms.test", "Admin@123");
    await page.goto("/users");
    const adminRow = page.getByTestId("user-row-admin@verandapms.test");
    await adminRow.getByRole("button", { name: "Deactivate" }).click();
    await page.reload();
    await expect(page).toHaveURL(/\/login/);
  });

  test("T-VH-13 (VH-13): Tampering role in veranda.v1.session localStorage grants admin UI", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page, "staff@verandapms.test", "Staff@123");
    await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);

    await page.evaluate(() => {
      const raw = window.localStorage.getItem("veranda.v1.session");
      const parsed = JSON.parse(raw!);
      parsed.role = "admin";
      window.localStorage.setItem("veranda.v1.session", JSON.stringify(parsed));
    });
    await page.reload();
    await expect(page.getByRole("link", { name: "Users" })).toBeVisible();
    await page.goto("/rooms");
    await expect(page.getByTestId("delete-room-SB-1001")).toBeVisible();
  });

  test("T-VH-14 (VH-14): Passwords stored in plaintext inside veranda.v1.db", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Reset demo data" }).click();
    const rawDb = await page.evaluate(() =>
      window.localStorage.getItem("veranda.v1.db")
    );
    expect(rawDb).toContain('"password":"Admin@123"');
  });

  test("Multi-group ownership: Group 1 mutation stays isolated from Group 2", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page, "group1@verandapms.test", "Group1@123");
    await expect(page.getByTestId("workspace-owner-group")).toContainText(
      "Group 1"
    );

    await page.goto("/rooms/rm-1001");
    await page.getByTestId("room-detail-delete").click();
    await expect(page).toHaveURL(/\/rooms$/);
    await expect(page.getByTestId("room-row-SB-1001")).toHaveCount(0);

    await page.getByRole("button", { name: "Sign out" }).first().click();
    await expect(page).toHaveURL(/\/login/);

    await page.locator("#login-email").fill("group2@verandapms.test");
    await page.locator("#login-password").fill("Group2@123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId("workspace-owner-group")).toContainText(
      "Group 2"
    );

    await page.goto("/rooms");
    await expect(page.getByTestId("room-row-SB-1001")).toBeVisible();
  });
});

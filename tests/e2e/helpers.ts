import { expect, type Page } from "@playwright/test";

export async function resetSandboxAndSignIn(
  page: Page,
  email: string = "admin@verandapms.test",
  password: string = "Admin@123"
) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Reset demo data" }).click();
  await expect(page.locator("#login-email")).toBeVisible();
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

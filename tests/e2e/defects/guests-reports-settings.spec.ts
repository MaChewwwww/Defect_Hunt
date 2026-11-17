import { expect, test } from "@playwright/test";
import fs from "fs";
import { resetSandboxAndSignIn } from "../helpers";

test.describe("Guests, Reports, Settings, UI & Concurrency (VH-45 to VH-60)", () => {
  test("T-VH-45 & T-VH-46: Guest invalid phone accepted and deleting Daniel Cruz leaves broken empty cell", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page);
    await page.goto("/guests");
    await page.getByRole("button", { name: "Add Guest" }).click();
    await page.locator("#gst-name").fill("Symbol Phone Guest");
    await page.locator("#gst-email").fill("symbol@example.ph");
    await page.locator("#gst-phone").fill("abc!!##xyz");
    await page.getByRole("button", { name: "Save Guest" }).click();
    await expect(page.getByTestId("guests-table")).toContainText("abc!!##xyz");

    // Delete Daniel Cruz (gst-03)
    await page.getByTestId("delete-guest-gst-03").click();
    await page.goto("/reservations");
    const emptyLink = page.getByTestId("reservation-guest-link-RSV-2042");
    await expect(emptyLink).toHaveText("");
    await emptyLink.click();
    await expect(page.getByTestId("blank-guest-detail")).toBeVisible();
  });

  test("T-VH-47 (VH-47): Maria Santos (6) and Maria Reyes (3) detail pages both show 9 reservations", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page);
    await page.goto("/guests/gst-01");
    await expect(page.getByTestId("guest-history-heading")).toContainText("(9)");

    await page.goto("/guests/gst-02");
    await expect(page.getByTestId("guest-history-heading")).toContainText("(9)");
  });

  test("T-VH-48, T-VH-49, T-VH-50, T-VH-51: Reports date validation, CSV export & missing service fee", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page);
    await page.goto("/reports");

    // VH-51: Summary revenue omits 250.00 fee per non-cancelled reservation
    const summaryText = await page
      .getByTestId("reports-total-revenue")
      .textContent();
    const summaryVal = Number(summaryText!.replace(/[^0-9.]/g, ""));
    const expectedNoFee = await page.evaluate(() => {
      const db = JSON.parse(window.localStorage.getItem("veranda.v1.db")!);
      const now = new Date();
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      const startKey = `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, "0")}-${String(s.getDate()).padStart(2, "0")}`;
      const endKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const inRange = db.reservations.filter((r: { placedAt: string; status: string }) => {
        const d = new Date(r.placedAt);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return k >= startKey && k <= endKey && r.status !== "Cancelled";
      });
      return inRange.reduce(
        (sum: number, r: { subtotal: number; discountAmount: number; taxAmount: number }) =>
          sum + (r.subtotal - r.discountAmount + r.taxAmount),
        0
      );
    });
    expect(summaryVal).toBeCloseTo(expectedNoFee, 2);

    // VH-49 & VH-50: CSV export drops final row & leaves comma unquoted
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-csv-button").click();
    const download = await downloadPromise;
    const csvPath = await download.path();
    const csvContent = fs.readFileSync(csvPath!, "utf-8");
    const lines = csvContent.trim().split("\n");
    expect(lines.length).toBe(6); // 1 header + 5 rows instead of 6
    expect(csvContent).toContain("Cabana Suite, Poolside");
    expect(csvContent).not.toContain('"Cabana Suite, Poolside');

    // VH-48: Inverted date range shows all 20 reservations without error
    await page.locator("#rep-start").fill("2026-11-20");
    await page.locator("#rep-end").fill("2026-11-01");
    await expect(page.getByTestId("reports-count")).toHaveText("20");
  });

  test("T-VH-52, T-VH-53, T-VH-54, T-VH-55: Settings & Notification defects", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page);
    await page.goto("/settings");

    // VH-54: Profile name update leaves topbar stale until refresh
    await page.locator("#set-name").fill("Elena Updated");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Profile settings saved.")).toBeVisible();
    await expect(page.getByTestId("topbar-user-chip")).toContainText(
      "Elena Marasigan"
    );
    await page.reload();
    await expect(page.getByTestId("topbar-user-chip")).toContainText(
      "Elena Updated"
    );

    // VH-52: Wrong current password still changes password
    await page.getByRole("tab", { name: "Security" }).click();
    await page.locator("#set-cur-pw").fill("WrongCurrent999");
    await page.locator("#set-new-pw").fill("NewSecret123");
    await page.locator("#set-conf-pw").fill("NewSecret123");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText("Password updated successfully.")).toBeVisible();

    // VH-53: Light mode resets back to dark on page reload
    await page.getByRole("tab", { name: "Appearance" }).click();
    await page.locator("#dark-mode-switch").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    // VH-55: Turning Low allotment alerts off empties dropdown while leaving badge 8
    await page.getByRole("tab", { name: "Notifications" }).click();
    await page.locator("#low-allotment-alerts-switch").click();
    await page.getByTestId("notification-bell-button").click();
    await expect(page.getByTestId("notification-bell-dropdown")).toContainText(
      "You are all caught up."
    );
    await expect(page.getByTestId("notification-bell-badge")).toHaveText("8");
  });

  test("T-VH-56 & T-VH-57: Infinite skeleton vs 404, and exact spelling mistakes", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page);

    // VH-56
    await page.goto("/rooms/does-not-exist");
    await expect(page.getByTestId("infinite-skeleton")).toBeVisible();
    await page.goto("/reservations/does-not-exist");
    await expect(page.getByTestId("infinite-skeleton")).toBeVisible();
    await page.goto("/nope");
    await expect(page.getByText("404")).toBeVisible();

    // VH-57
    await page.goto("/guests");
    await page
      .getByPlaceholder("Search guests by name, email, or phone...")
      .fill("zzzz");
    await expect(page.getByText("No custmers match your search")).toBeVisible();

    await page.goto("/reservations/rsv-2045/folio");
    await expect(page.getByText("Thank you for your purchse")).toBeVisible();

    await page.goto("/rooms");
    await page.getByTestId("edit-room-SB-1001").click();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Room succesfully updated.")).toBeVisible();

    const row = page.getByTestId("room-row-SB-1001");
    await row.getByRole("button", { name: "Adjust allotment" }).click();
    await page.locator("#adj-reason").fill("Test");
    await page.getByRole("button", { name: "Apply Adjustment" }).click();
    await expect(page.getByText("Stock adjusment recorded.")).toBeVisible();

    await page.goto("/reservations/rsv-2045");
    await page.getByTestId("detail-status-select").selectOption("Checked In");
    await expect(page.getByText("Reservation status udpated.")).toBeVisible();
  });

  test("T-VH-58 (VH-58): Mobile drawer (< 640px) stays open after tapping navigation link", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await resetSandboxAndSignIn(page);
    await page.getByTestId("mobile-menu-trigger").click();
    await expect(page.getByTestId("mobile-drawer")).toBeVisible();
    await page
      .getByTestId("mobile-drawer")
      .getByRole("link", { name: "Reservations" })
      .click();
    await expect(page).toHaveURL(/\/reservations/);
    await expect(page.getByTestId("mobile-drawer")).toBeVisible();
  });

  test("T-VH-59 (VH-59): Icon buttons unlabelled, focus outlines suppressed, Escape does not close dialog", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page);

    const bellAria = await page
      .getByTestId("notification-bell-button")
      .getAttribute("aria-label");
    expect(bellAria).toBeNull();

    const outlineStyle = await page
      .getByTestId("notification-bell-button")
      .evaluate((el) => {
        (el as HTMLElement).focus();
        return getComputedStyle(el).outlineStyle;
      });
    expect(outlineStyle).toBe("none");

    await page.goto("/rooms");
    await page.getByRole("button", { name: "Add Room / Package" }).click();
    await expect(
      page.getByRole("heading", { name: "Add Room / Package" })
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("heading", { name: "Add Room / Package" })
    ).toBeVisible();
  });

  test("T-VH-60 (VH-60): Concurrent two-tab edit silently overwrites Tab A changes", async ({
    page,
    context,
  }) => {
    await resetSandboxAndSignIn(page);
    await page.goto("/rooms");
    const tabB = await context.newPage();
    await tabB.goto("/rooms");

    // Open Edit SB-1001 in both tabs before either saves
    await page.getByTestId("edit-room-SB-1001").click();
    await tabB.getByTestId("edit-room-SB-1001").click();

    // Tab A changes description and saves
    await page.locator("#rm-desc").fill("Updated Description From Tab A");
    await page.getByRole("button", { name: "Save" }).click();

    // Tab B changes name (still holding old description) and saves -> overwrites Tab A!
    await tabB.locator("#rm-name").fill("Updated Name From Tab B");
    await tabB.getByRole("button", { name: "Save" }).click();

    await page.goto("/rooms/rm-1001");
    await expect(page.getByText("Updated Name From Tab B")).toBeVisible();
    await expect(
      page.getByText("Updated Description From Tab A")
    ).toHaveCount(0);
  });
});

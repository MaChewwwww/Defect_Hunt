import { expect, test } from "@playwright/test";
import { resetSandboxAndSignIn } from "../helpers";

test.describe("Dashboard & Rooms/Packages (VH-16 to VH-30)", () => {
  test("T-VH-16 & T-VH-20: Dashboard 30d revenue includes Cancelled & ABV divides by all reservations", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page);
    await page.getByTestId("dashboard-range-select").selectOption("30d");

    const revenueText = await page.getByTestId("kpi-total-revenue").textContent();
    const abvText = await page.getByTestId("kpi-abv").textContent();

    const revenueVal = Number(revenueText!.replace(/[^0-9.]/g, ""));
    const abvVal = Number(abvText!.replace(/[^0-9.]/g, ""));

    const expected = await page.evaluate(() => {
      const db = JSON.parse(window.localStorage.getItem("veranda.v1.db")!);
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const in30d = db.reservations.filter((r: { placedAt: string }) => {
        const d = new Date(r.placedAt);
        return d >= start && d <= end;
      });
      const allSum = in30d.reduce((s: number, r: { grandTotal: number }) => s + r.grandTotal, 0);
      const nonCancelled = in30d.filter((r: { status: string }) => r.status !== "Cancelled");
      const nonCancelSum = nonCancelled.reduce((s: number, r: { grandTotal: number }) => s + r.grandTotal, 0);
      return {
        allSum,
        defectiveAbv: nonCancelSum / in30d.length,
        canonicalAbv: nonCancelSum / nonCancelled.length,
      };
    });

    expect(revenueVal).toBeCloseTo(expected.allSum, 2);
    expect(abvVal).toBeCloseTo(expected.defectiveAbv, 2);
    expect(abvVal).toBeLessThan(expected.canonicalAbv);
  });

  test("T-VH-17 (VH-17): Low Allotment KPI is 8 while Watchlist table has 7 rows (omits SB-1006)", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page);
    await expect(page.getByTestId("kpi-low-allotment")).toHaveText("8");
    const rows = page.getByTestId("low-allotment-watchlist").locator("tbody tr");
    await expect(rows).toHaveCount(7);
    await expect(page.getByTestId("low-row-SB-1006")).toHaveCount(0);
  });

  test("T-VH-18 (VH-18): Monthly chart buckets 12:30 AM Manila 1st-of-month booking into prior UTC month", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page);
    const { prevUtcKey, lastLocalKey } = await page.evaluate(() => {
      const now = new Date();
      const lastLocal = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const twoAgoUtc = new Date(Date.UTC(lastLocal.getFullYear(), lastLocal.getMonth() - 1, 1));
      return {
        lastLocalKey: `${lastLocal.getFullYear()}-${String(lastLocal.getMonth() + 1).padStart(2, "0")}`,
        prevUtcKey: `${twoAgoUtc.getUTCFullYear()}-${String(twoAgoUtc.getUTCMonth() + 1).padStart(2, "0")}`,
      };
    });

    // RSV-2033 (12:30 AM 1st of last month Manila) lands in two-months-ago UTC bar (+1 count)
    // and is missing from lastLocalKey's Dashboard bar compared to Reports "Last month"
    await page.getByTestId(`chart-bar-${prevUtcKey}`).hover();
    const prevTooltipCount = await page
      .getByTestId("chart-tooltip-count")
      .textContent();
    await page.getByTestId(`chart-bar-${lastLocalKey}`).hover();
    const lastTooltipCount = await page
      .getByTestId("chart-tooltip-count")
      .textContent();
    const chartLastCount = Number(
      lastTooltipCount!.match(/(\d+)/)?.[1] ?? 0
    );
    expect(prevTooltipCount).toContain("3 reservations");

    await page.goto("/reports");
    await page.locator("#rep-preset").selectOption("last-month");
    const reportsLastCount = Number(
      await page.getByTestId("reports-count").textContent()
    );
    expect(reportsLastCount).toBe(chartLastCount + 1);
  });

  test("T-VH-19 (VH-19): Dashboard Last 7 days excludes today's 3 reservations", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page);
    await page.getByTestId("dashboard-range-select").selectOption("7d");
    await expect(page.getByTestId("kpi-reservations-count")).toHaveText("3");

    await page.goto("/reports");
    await expect(page.getByTestId("reports-count")).toHaveText("6");
  });

  test("T-VH-21, T-VH-22, T-VH-23: Room form validation defects (negative allotment, case-sensitive code, blank spaces name)", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page);
    await page.goto("/rooms");

    // VH-23: spaces-only name saved
    await page.getByRole("button", { name: "Add Room / Package" }).click();
    await page.locator("#rm-code").fill("SB-9023");
    await page.locator("#rm-name").fill("   ");
    await page.locator("#rm-rate").fill("1000");
    await page.locator("#rm-units").fill("5");
    await page.getByRole("button", { name: "Save" }).click();
    await page.getByPlaceholder("Search code or name...").fill("SB-9023");
    await expect(page.getByTestId("room-row-SB-9023")).toBeVisible();

    // VH-21: negative allotment saved
    await page.getByRole("button", { name: "Add Room / Package" }).click();
    await page.locator("#rm-code").fill("SB-9021");
    await page.locator("#rm-name").fill("Negative Allotment Villa");
    await page.locator("#rm-rate").fill("1000");
    await page.locator("#rm-units").fill("-7");
    await page.getByRole("button", { name: "Save" }).click();
    await page.getByPlaceholder("Search code or name...").fill("SB-9021");
    await expect(page.getByTestId("room-row-SB-9021")).toContainText("-7");

    // VH-22: lowercase duplicate code sb-1001 accepted
    await page.getByRole("button", { name: "Add Room / Package" }).click();
    await page.locator("#rm-code").fill("sb-1001");
    await page.locator("#rm-name").fill("Lowercase Duplicate Code");
    await page.locator("#rm-rate").fill("1000");
    await page.locator("#rm-units").fill("4");
    await page.getByRole("button", { name: "Save" }).click();
    await page.getByPlaceholder("Search code or name...").fill("sb-1001");
    await expect(page.getByTestId("room-row-sb-1001")).toBeVisible();
  });

  test("T-VH-25 (VH-25): Pagination Next drops Category filter on /rooms", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page);
    await page.goto("/rooms");
    await page.getByTestId("rooms-category-filter").selectOption("Villas & Suites");
    await expect(page.getByTestId("rooms-table").locator("tbody tr")).toHaveCount(10);

    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByTestId("rooms-category-filter")).toHaveValue("All");
    await expect(page.getByTestId("rooms-table").locator("tbody tr")).toHaveCount(10);
  });

  test("T-VH-26 (VH-26): Rate (high to low) sorts as text while low to high sorts numerically", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page);
    await page.goto("/rooms");
    await page.getByTestId("rooms-sort-select").selectOption("rate-desc");
    const firstDescRate = await page
      .getByTestId("rooms-table")
      .locator("tbody tr")
      .first()
      .textContent();
    expect(firstDescRate).toContain("990.00");

    await page.getByTestId("rooms-sort-select").selectOption("rate-asc");
    const firstAscRate = await page
      .getByTestId("rooms-table")
      .locator("tbody tr")
      .first()
      .textContent();
    expect(firstAscRate).toContain("250.00");
  });

  test("T-VH-27 (VH-27): List delete prompts confirmation dialog while detail page deletes immediately", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page);
    await page.goto("/rooms");
    await page.getByTestId("delete-room-SB-1001").click();
    await expect(
      page.getByRole("heading", { name: "Delete Room / Package" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();

    await page.goto("/rooms/rm-1001");
    await page.getByTestId("room-detail-delete").click();
    await expect(page).toHaveURL(/\/rooms$/);
    await expect(page.getByTestId("room-row-SB-1001")).toHaveCount(0);
  });

  test("T-VH-28 (VH-28): Edit Room Cancel discards name change but saves modified rate", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page);
    await page.goto("/rooms");
    await page.getByTestId("edit-room-SB-1010").click();
    await page.locator("#rm-name").fill("Should Be Discarded");
    await page.locator("#rm-rate").fill("555");
    await page.getByRole("button", { name: "Cancel" }).click();

    const row = page.getByTestId("room-row-SB-1010");
    await expect(row).toContainText("Eucalyptus Steam & Spa Ritual");
    await expect(row).toContainText("555.00");
  });

  test("T-VH-30 (VH-30): Adjust allotment Remove 50 from Terracotta Courtyard Suite (7) yields -43", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page);
    await page.goto("/rooms");
    const row = page.getByTestId("room-row-SB-1008");
    await row.getByRole("button", { name: "Adjust allotment" }).click();
    await page.locator("#adj-type").selectOption("remove");
    await page.locator("#adj-qty").fill("50");
    await page.locator("#adj-reason").fill("Renovation block");
    await page.getByRole("button", { name: "Apply Adjustment" }).click();
    await expect(row).toContainText("-43");
  });
});

import { expect, test } from "@playwright/test";
import { resetSandboxAndSignIn } from "../helpers";

test.describe("Reservations & Guest Folios (VH-15, VH-24, VH-29, VH-31 to VH-44)", () => {
  test("T-VH-15 (VH-15): Stored XSS payload in notes is escaped on detail and executes on folio", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page);
    await page.goto("/reservations/new");
    await page.getByTestId("add-room-select").selectOption("rm-1002");
    await page.getByTestId("add-room-line-btn").click();
    await page.locator("#rsv-notes").fill('<img src=x onerror="alert(1)">');
    await page.getByTestId("place-reservation-btn").click();
    await expect(page).toHaveURL(/\/reservations$/);

    await page.getByRole("link", { name: "RSV-2046" }).click();
    await expect(page.getByTestId("detail-notes")).toHaveText(
      '<img src=x onerror="alert(1)">'
    );

    const dialogPromise = page.waitForEvent("dialog");
    await page.getByRole("link", { name: "View folio" }).click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toBe("1");
    await dialog.dismiss();
  });

  test("T-VH-24 (VH-24): Adding SB-1009 causes horizontal overflow in draft lines container", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page);
    await page.goto("/reservations/new");
    await page.getByTestId("add-room-select").selectOption("rm-1009");
    await page.getByTestId("add-room-line-btn").click();

    const overflow = await page
      .getByTestId("reservation-lines-container")
      .evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(overflow).toBe(true);
  });

  test("T-VH-29 (VH-29): Editing SB-1002 rate mutates existing RSV-2045 total", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page);
    await page.goto("/reservations");
    await expect(page.getByTestId("reservation-total-RSV-2045")).toContainText(
      "1,370.00"
    );

    await page.goto("/rooms");
    await page.getByTestId("edit-room-SB-1002").click();
    await page.locator("#rm-rate").fill("800");
    await page.getByRole("button", { name: "Save" }).click();

    await page.goto("/reservations");
    await expect(page.getByTestId("reservation-total-RSV-2045")).toContainText(
      "2,042.00"
    );
  });

  test("T-VH-31, T-VH-32, T-VH-33, T-VH-34, T-VH-35: Reservation creation validation & math defects", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page);
    await page.goto("/reservations/new");

    // VH-32: Sunset Catamaran Charter x2 (2,400.00), discount 10 -> VAT 288.00, Total 2,698.00
    await page.getByTestId("add-room-select").selectOption("rm-1003");
    await page.getByTestId("add-room-line-btn").click();
    await page.getByTestId("line-qty-0").fill("2");
    await page.locator("#rsv-discount").fill("10");
    await expect(page.getByTestId("folio-grand-total")).toContainText(
      "2,698.00"
    );

    // VH-33: Discount 150 and -20 accepted
    await page.locator("#rsv-discount").fill("150");
    await expect(page.getByTestId("folio-grand-total")).toContainText("-");

    // VH-35: Single line of 24 on SB-1011 (23 avail) shows error; two lines of 20 each succeed -> -17
    await page.goto("/reservations/new");
    await page.getByTestId("add-room-select").selectOption("rm-1011");
    await page.getByTestId("add-room-line-btn").click();
    await page.getByTestId("line-qty-0").fill("24");
    await page.getByTestId("place-reservation-btn").click();
    await expect(page.getByTestId("create-reservation-error")).toContainText(
      "Only 23 available"
    );

    await page.getByTestId("line-qty-0").fill("20");
    await page.getByTestId("add-room-line-btn").click();
    await page.getByTestId("line-qty-1").fill("20");
    await page.getByTestId("place-reservation-btn").click();
    await expect(page).toHaveURL(/\/reservations$/);

    await page.goto("/rooms");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByTestId("room-row-SB-1011")).toContainText("-17");

    // VH-31 & VH-34: Book out-of-allotment SB-1007 with fractional qty 2.5
    await page.goto("/reservations/new");
    await page.getByTestId("add-room-select").selectOption("rm-1007");
    await page.getByTestId("add-room-line-btn").click();
    await page.getByTestId("line-qty-0").fill("2.5");
    await page.getByTestId("place-reservation-btn").click();
    await expect(page).toHaveURL(/\/reservations$/);

    await page.goto("/rooms");
    await expect(page.getByTestId("room-row-SB-1007")).toContainText("-2.5");
  });

  test("T-VH-36, T-VH-37, T-VH-38, T-VH-39: Reservation status transitions & detail fee double-count", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page);

    // VH-39: List shows 1,370.00 while detail shows 1,620.00
    await page.goto("/reservations/rsv-2045");
    await expect(page.getByTestId("folio-grand-total")).toContainText(
      "1,620.00"
    );

    // VH-36: Cancelling Confirmed RSV-2045 leaves SB-1002 at 26; Cancelling Pending RSV-2044 restores SB-1003 to 20
    await page.getByTestId("detail-status-select").selectOption("Cancelled");
    await page.goto("/rooms");
    await expect(page.getByTestId("room-row-SB-1002")).toContainText("26");

    await page.goto("/reservations/rsv-2044");
    await page.getByTestId("detail-status-select").selectOption("Cancelled");
    await page.goto("/rooms");
    await expect(page.getByTestId("room-row-SB-1003")).toContainText("20");

    // VH-37: Cancelled RSV-2037 offers reopening options
    await page.goto("/reservations/rsv-2037");
    await expect(page.getByTestId("detail-status-select")).toBeVisible();
    const options = await page
      .getByTestId("detail-status-select")
      .locator("option")
      .allTextContents();
    expect(options).toContain("Checked In");
    expect(options).toContain("Checked Out");

    // VH-38: Pending -> Confirmed on RSV-2043 deducts SB-1004 (34->33) and SB-1005 (96->93) again
    await page.goto("/reservations/rsv-2043");
    await page.getByTestId("detail-status-select").selectOption("Confirmed");
    await page.goto("/rooms");
    await expect(page.getByTestId("room-row-SB-1004")).toContainText("33");
    await expect(page.getByTestId("room-row-SB-1005")).toContainText("93");
  });

  test("T-VH-40 (VH-40): Status filter Checked In also includes Checked Out", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page);
    await page.goto("/reservations");
    await page
      .getByTestId("reservations-status-filter")
      .selectOption("Checked In");
    await expect(page.getByTestId("reservations-table")).toContainText(
      "Checked Out"
    );
  });

  test("T-VH-41 (VH-41): Double-clicking Place Reservation creates two consecutive reservations", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page);
    await page.goto("/reservations/new");
    await page.getByTestId("add-room-select").selectOption("rm-1002");
    await page.getByTestId("add-room-line-btn").click();
    await page.getByTestId("place-reservation-btn").dblclick();
    await expect(page).toHaveURL(/\/reservations$/);
    await expect(page.getByTestId("reservation-row-RSV-2046")).toBeVisible();
    await expect(page.getByTestId("reservation-row-RSV-2047")).toBeVisible();
  });

  test("T-VH-42 & T-VH-44: Future date accepted, detail shows DD/MM/YYYY and UTC time", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page);
    await page.goto("/reservations/new");
    await page.locator("#rsv-date").fill("2027-12-25");
    await page.getByTestId("add-room-select").selectOption("rm-1002");
    await page.getByTestId("add-room-line-btn").click();
    await page.getByTestId("place-reservation-btn").click();
    await expect(page).toHaveURL(/\/reservations$/);

    await expect(
      page.getByTestId("reservation-date-RSV-2046")
    ).toContainText("12/25/2027");
    await page.getByRole("link", { name: "RSV-2046" }).click();
    await expect(
      page.getByTestId("detail-placed-timestamp")
    ).toContainText("25/12/2027");

    // VH-44: RSV-2033 placed 12:30 AM Manila on 1st of last month shows 30th/prior month 04:30 PM UTC on detail
    await page.goto("/reservations/rsv-2033");
    await expect(
      page.getByTestId("detail-placed-timestamp")
    ).toContainText("04:30 PM");
  });

  test("T-VH-43 (VH-43): Folio omits 250.00 service fee from Grand Total and omits guest name", async ({
    page,
  }) => {
    await resetSandboxAndSignIn(page);
    await page.goto("/reservations/rsv-2045/folio");
    await expect(page.getByTestId("folio-grand-total")).toContainText(
      "1,120.00"
    );
    await expect(page.getByTestId("folio-billed-to")).not.toContainText(
      "Maria Reyes"
    );
  });
});

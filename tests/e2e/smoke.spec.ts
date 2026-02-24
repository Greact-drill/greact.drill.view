import { expect, test } from "@playwright/test";

test("rigs list route smoke", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL("/");
  await expect(page.locator(".rigs-page-title")).toContainText("Буровые установки", {
    timeout: 30_000,
  });
});

test("main route smoke", async ({ page }) => {
  await page.goto("/rigs/14820");
  await expect(page).toHaveURL(/\/rigs\/14820$/);
  await expect(page.locator(".page-title")).toContainText("Буровая установка", {
    timeout: 30_000,
  });
});

test("documents route smoke", async ({ page }) => {
  await page.goto("/rigs/14820/documents");
  await expect(page).toHaveURL(/\/rigs\/14820\/documents$/);
  await expect(page.locator("body")).toContainText("Документы буровой");
});

test("archive route smoke", async ({ page }) => {
  await page.goto("/rigs/14820/archive");
  await expect(page).toHaveURL(/\/rigs\/14820\/archive$/);
  await expect(page.locator("body")).toContainText("Архив данных");
});

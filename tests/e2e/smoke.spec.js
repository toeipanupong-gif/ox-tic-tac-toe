import { test, expect } from "@playwright/test";

test("landing page shows brand and Google login", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("OX Arena").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Continue with Google/i })).toBeVisible();
});

test("login page is available", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
});

test("protected dashboard redirects to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/login/);
});

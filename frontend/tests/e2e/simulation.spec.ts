import { test, expect } from "@playwright/test";
test("um cenário real via proxy, seguido por comparação", async ({ page }) => {
  let posts = 0;
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().endsWith("/api/v1/predictions"))
      posts++;
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Nova análise", exact: true }).click();
  await page.getByRole("button", { name: "Usar exemplo" }).click();
  await page.getByRole("button", { name: /Gerar análise/ }).click();
  await expect(page.getByText("Estimativa concluída")).toBeVisible();
  expect(posts).toBe(1);
  await page.getByLabel("Renda mediana", { exact: false }).fill("5");
  await page.getByRole("button", { name: /Gerar análise/ }).click();
  await expect(page.getByText("Estimativa concluída")).toBeVisible();
  await page.getByRole("link", { name: /Meus cenários/ }).click();
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(
    page.getByRole("img", { name: /Comparação dos valores/ }),
  ).toBeVisible();
});

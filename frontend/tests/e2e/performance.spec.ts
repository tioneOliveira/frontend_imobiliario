import { test, expect } from "@playwright/test";
test("19 de 20 análises controladas aparecem em até cinco segundos", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/#simulation");
  await page.getByRole("button", { name: "Usar exemplo" }).click();
  let passed = 0;
  for (let i = 0; i < 20; i++) {
    const start = Date.now();
    await page.getByRole("button", { name: /Gerar análise/ }).click();
    await expect(
      page.getByRole("button", { name: /Gerar análise/ }),
    ).toBeEnabled();
    await expect(page.getByText("Estimativa concluída")).toBeVisible();
    if (Date.now() - start <= 5000) passed++;
  }
  expect(passed).toBeGreaterThanOrEqual(19);
});

import { test, expect } from "@playwright/test";
test("histórico vazio permanece claro sem dados demonstrativos", async ({
  page,
}) => {
  await page.goto("/#scenarios");
  await expect(
    page.getByRole("heading", {
      name: "Ainda há possibilidades para explorar",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Criar primeiro cenário" }).click();
  await expect(
    page.getByRole("heading", { name: "Explore o seu cenário." }),
  ).toBeVisible();
});

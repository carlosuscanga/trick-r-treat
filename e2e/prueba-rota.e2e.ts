import { expect, test } from '@playwright/test';

// PRUEBA T-033: e2e roto a propósito para comprobar que el ruleset bloquea el merge.
// Este archivo NUNCA debe entrar a main.
test('PRUEBA T-033: falla a propósito', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByText('Este texto no existe en el juego')).toBeVisible({ timeout: 2000 });
});

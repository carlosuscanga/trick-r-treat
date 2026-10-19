import type { Page } from '@playwright/test';
import { esperarEscena, irA } from './fugas';

// Atajos de los e2e para llegar a una escena sin recorrer el menú (sin `.e2e.` en el nombre: no es un test).

/** Desde la página recién abierta (Arranque activa) lleva a la Calle por el SceneManager, sin pasar por el Menú. */
export async function irACalle(page: Page): Promise<void> {
  await esperarEscena(page, 'Arranque');
  await irA(page, 'Arranque', 'Calle');
}

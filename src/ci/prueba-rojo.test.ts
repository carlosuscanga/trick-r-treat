import { expect, it } from 'vitest';

// PR de prueba de T-031: este test falla a propósito. Nunca se mergea.
it('falla a propósito', () => {
  expect(1).toBe(2);
});

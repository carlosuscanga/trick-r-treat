import type { Page } from '@playwright/test';

// Toques sintéticos de varios dedos. El `touchscreen` de Playwright solo hace un toque
// a la vez, así que se despacha el evento a mano sobre el canvas, que es de donde
// Phaser lo lee. `new Touch()` no existe en este WebKit ("Illegal constructor"):
// cada toque es un objeto suelto con los campos que Phaser usa.

// x, y en coordenadas lógicas del juego (alto 720, ancho variable), no en píxeles de pantalla.
export type Dedo = { id: number; x: number; y: number };

export type TipoToque = 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel';

// Devuelve `defaultPrevented`: true si el juego canceló el evento (no hay scroll ni zoom).
export function tocar(page: Page, tipo: TipoToque, dedos: Dedo[]): Promise<boolean> {
  return page.evaluate(
    ({ tipo, dedos }) => {
      const canvas = document.querySelector('canvas')!;
      const caja = canvas.getBoundingClientRect();
      const { width, height } = window.__juego!.scale.gameSize;

      const toques = dedos.map((d) => {
        const clientX = caja.left + (d.x / width) * caja.width;
        const clientY = caja.top + (d.y / height) * caja.height;
        return {
          identifier: d.id,
          clientX,
          clientY,
          pageX: clientX + window.scrollX,
          pageY: clientY + window.scrollY,
          screenX: clientX,
          screenY: clientY,
          target: canvas,
        };
      });

      const evento = new Event(tipo, { bubbles: true, cancelable: true });
      // touchend y touchcancel ya no cuentan el dedo que se levanta en `touches`.
      const sigueAbajo = tipo === 'touchend' || tipo === 'touchcancel' ? [] : toques;
      Object.defineProperty(evento, 'changedTouches', { value: toques });
      Object.defineProperty(evento, 'touches', { value: sigueAbajo });
      canvas.dispatchEvent(evento);
      return evento.defaultPrevented;
    },
    { tipo, dedos },
  );
}

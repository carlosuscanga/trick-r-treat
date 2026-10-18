import type { Page } from '@playwright/test';

// Toques sintéticos de varios dedos. El `touchscreen` de Playwright solo hace un toque
// a la vez, así que se despacha el evento a mano, por defecto sobre el canvas, que es
// de donde Phaser lo lee. `new Touch()` no existe en este WebKit ("Illegal constructor"):
// cada toque es un objeto suelto con los campos que Phaser usa.

// x, y en coordenadas lógicas del juego (alto 720, ancho variable), no en píxeles de
// pantalla. Con `css: true`, en píxeles CSS de la página.
export type Dedo = { id: number; x: number; y: number };

export type TipoToque = 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel';

export type OpcionesToque = {
  /** Las coordenadas de los dedos ya están en píxeles CSS (no se convierten). */
  css?: boolean;
  /**
   * Despacha el evento sobre el elemento que de verdad está bajo el primer dedo
   * (`document.elementFromPoint`), como hace el navegador, y no siempre sobre el canvas.
   */
  bajoElDedo?: boolean;
};

// Devuelve `defaultPrevented`: true si el juego canceló el evento (no hay scroll ni zoom).
export function tocar(page: Page, tipo: TipoToque, dedos: Dedo[], opciones: OpcionesToque = {}): Promise<boolean> {
  return page.evaluate(
    ({ tipo, dedos, opciones }) => {
      const canvas = document.querySelector('canvas')!;
      const caja = canvas.getBoundingClientRect();
      const { width, height } = window.__juego!.scale.gameSize;

      const toques = dedos.map((d) => {
        const clientX = opciones.css ? d.x : caja.left + (d.x / width) * caja.width;
        const clientY = opciones.css ? d.y : caja.top + (d.y / height) * caja.height;
        const target = opciones.bajoElDedo ? (document.elementFromPoint(clientX, clientY) ?? canvas) : canvas;
        return {
          identifier: d.id,
          clientX,
          clientY,
          pageX: clientX + window.scrollX,
          pageY: clientY + window.scrollY,
          screenX: clientX,
          screenY: clientY,
          target,
        };
      });

      const evento = new Event(tipo, { bubbles: true, cancelable: true });
      // touchend y touchcancel ya no cuentan el dedo que se levanta en `touches`.
      const sigueAbajo = tipo === 'touchend' || tipo === 'touchcancel' ? [] : toques;
      Object.defineProperty(evento, 'changedTouches', { value: toques });
      Object.defineProperty(evento, 'touches', { value: sigueAbajo });
      (toques[0]?.target ?? canvas).dispatchEvent(evento);
      return evento.defaultPrevented;
    },
    { tipo, dedos, opciones },
  );
}

// Convierte coordenadas lógicas del juego a píxeles CSS con el tamaño de ahora.
export function aCss(page: Page, x: number, y: number): Promise<{ x: number; y: number }> {
  return page.evaluate(
    ({ x, y }) => {
      const caja = document.querySelector('canvas')!.getBoundingClientRect();
      const { width, height } = window.__juego!.scale.gameSize;
      return { x: caja.left + (x / width) * caja.width, y: caja.top + (y / height) * caja.height };
    },
    { x, y },
  );
}

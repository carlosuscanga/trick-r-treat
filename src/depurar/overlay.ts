// Overlay de ?depurar: un <pre> DOM, nunca un Text de Phaser (alteraría la medición). Sin Phaser.

const ESTILOS =
  'position:fixed;top:max(16px,env(safe-area-inset-top));left:max(16px,env(safe-area-inset-left));' +
  'z-index:999;margin:0;padding:6px 8px;border-radius:6px;background:rgba(0,0,0,.6);color:#fff;' +
  'font:11px/1.35 ui-monospace,Menlo,monospace;white-space:pre;pointer-events:none;' +
  'user-select:none;-webkit-user-select:none';

/** Monta el <pre> y lo actualiza cada 500 ms (se salta si la pestaña está oculta). */
export function montarOverlay(texto: () => string, doc: Document = document): void {
  const pre = doc.createElement('pre');
  pre.id = 'depurar-overlay';
  pre.style.cssText = ESTILOS;
  pre.textContent = texto();
  doc.body.append(pre);
  setInterval(() => {
    if (!doc.hidden) pre.textContent = texto();
  }, 500);
}

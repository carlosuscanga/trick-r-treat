import type Phaser from 'phaser';
import { AJUSTES_CAMBIADOS, type Ajustes } from '../movimiento/ajustes';

// Panel HTML de `?depurar`: deslizadores para afinar el salto, la velocidad y los
// botones en el iPhone sin recargar. Escribe en el objeto `ajustes` vivo (el del
// registry, sin copiarlo) y avisa con AJUSTES_CAMBIADOS. Sin Phaser de valor.

type Campo = {
  /** Ruta dentro de `Ajustes`, p. ej. `salto.alturaMax`. También es el `data-ajuste` del deslizador. */
  ruta: string;
  etiqueta: string;
  min: number;
  max: number;
  step: number;
};

const CAMPOS: readonly Campo[] = [
  { ruta: 'salto.alturaMax', etiqueta: 'Altura máxima (px)', min: 150, max: 400, step: 1 },
  { ruta: 'salto.alturaMin', etiqueta: 'Altura mínima (px)', min: 30, max: 150, step: 1 },
  { ruta: 'salto.tiempoSubida', etiqueta: 'Tiempo de subida (s)', min: 0.2, max: 0.6, step: 0.01 },
  { ruta: 'salto.tiempoCaida', etiqueta: 'Tiempo de caída (s)', min: 0.15, max: 0.5, step: 0.01 },
  { ruta: 'caminar.velocidad', etiqueta: 'Velocidad (px/s)', min: 200, max: 600, step: 1 },
  { ruta: 'salto.coyoteMs', etiqueta: 'Coyote (ms)', min: 0, max: 200, step: 1 },
  { ruta: 'salto.bufferMs', etiqueta: 'Búfer (ms)', min: 0, max: 250, step: 1 },
  { ruta: 'botones.radioToque', etiqueta: 'Radio de toque (px)', min: 50, max: 110, step: 1 },
  { ruta: 'botones.saltar.derecha', etiqueta: 'Saltar: derecha (px)', min: 60, max: 500, step: 1 },
  { ruta: 'botones.saltar.abajo', etiqueta: 'Saltar: abajo (px)', min: 60, max: 500, step: 1 },
  { ruta: 'botones.brazos.derecha', etiqueta: 'Brazos: derecha (px)', min: 60, max: 500, step: 1 },
  { ruta: 'botones.brazos.abajo', etiqueta: 'Brazos: abajo (px)', min: 60, max: 500, step: 1 },
];

const RUTA_APICE = 'salto.apiceColgado';

// touch-action y user-select propios: body los apaga y el panel necesita usarlos.
const ESTILOS = `
.depurar-boton{position:fixed;top:44px;left:50%;transform:translateX(-50%);z-index:1000;
  width:44px;height:44px;border-radius:22px;border:0;background:#000b;color:#fff;font-size:22px;
  touch-action:manipulation;user-select:none;-webkit-user-select:none}
.depurar-panel{position:fixed;top:92px;left:50%;transform:translateX(-50%);z-index:1000;
  width:min(520px,calc(100vw - 112px));max-height:calc(100vh - 140px);max-height:calc(100dvh - 140px);overflow-y:auto;
  box-sizing:border-box;padding:10px 14px;border-radius:12px;background:#000d;color:#fff;
  font:14px system-ui,sans-serif;pointer-events:auto;touch-action:auto;
  user-select:text;-webkit-user-select:text;-webkit-touch-callout:default;overscroll-behavior:contain}
.depurar-panel[hidden]{display:none}
.depurar-panel label{display:grid;grid-template-columns:1fr 52px;gap:2px 8px;margin:6px 0}
.depurar-panel input[type=range]{grid-column:1/3;width:100%}
.depurar-panel output{text-align:right;font-variant-numeric:tabular-nums}
.depurar-panel button{font:inherit;padding:8px 12px;margin-top:8px}
.depurar-panel textarea{width:100%;height:160px;margin-top:8px;box-sizing:border-box;font:12px monospace}
.depurar-panel p{margin:6px 0 0}
`;

type Hoja = Record<string, unknown>;

// Camina por la ruta hasta el objeto que tiene el último campo.
function dueno(raiz: Ajustes, ruta: string): { objeto: Hoja; campo: string } {
  const partes = ruta.split('.');
  const campo = partes.pop()!;
  let objeto = raiz as unknown as Hoja;
  for (const parte of partes) objeto = objeto[parte] as Hoja;
  return { objeto, campo };
}

export function montarPanel(game: Phaser.Game, ajustes: Ajustes, doc: Document = document): void {
  const estilo = doc.createElement('style');
  estilo.textContent = ESTILOS;
  doc.head.append(estilo);

  const boton = doc.createElement('button');
  boton.className = 'depurar-boton';
  boton.id = 'depurar-boton';
  boton.type = 'button';
  boton.textContent = '⚙︎';
  boton.setAttribute('aria-label', 'Ajustes de depuración');

  const panel = doc.createElement('div');
  panel.className = 'depurar-panel';
  panel.id = 'depurar-panel';
  panel.hidden = true;

  const avisar = () => game.events.emit(AJUSTES_CAMBIADOS);

  for (const campo of CAMPOS) {
    const { objeto, campo: nombre } = dueno(ajustes, campo.ruta);
    const fila = doc.createElement('label');
    const texto = doc.createElement('span');
    texto.textContent = campo.etiqueta;
    const salida = doc.createElement('output');
    salida.textContent = String(objeto[nombre]);
    const rango = doc.createElement('input');
    rango.type = 'range';
    rango.min = String(campo.min);
    rango.max = String(campo.max);
    rango.step = String(campo.step);
    rango.value = String(objeto[nombre]);
    rango.dataset.ajuste = campo.ruta;
    rango.addEventListener('input', () => {
      const valor = Number(rango.value);
      objeto[nombre] = valor;
      salida.textContent = String(valor);
      avisar();
    });
    fila.append(texto, salida, rango);
    panel.append(fila);
  }

  const { objeto: saltoObj, campo: apiceCampo } = dueno(ajustes, RUTA_APICE);
  const filaApice = doc.createElement('label');
  const casilla = doc.createElement('input');
  casilla.type = 'checkbox';
  casilla.checked = saltoObj[apiceCampo] === true;
  casilla.dataset.ajuste = RUTA_APICE;
  casilla.addEventListener('change', () => {
    saltoObj[apiceCampo] = casilla.checked;
    avisar();
  });
  filaApice.append(casilla, ' Ápice colgado');
  panel.append(filaApice);

  const copiar = doc.createElement('button');
  copiar.type = 'button';
  copiar.id = 'depurar-copiar';
  copiar.textContent = 'Copiar valores';
  const mensaje = doc.createElement('p');
  panel.append(copiar, mensaje);

  copiar.addEventListener('click', async () => {
    const json = JSON.stringify(ajustes, null, 2);
    doc.getElementById('depurar-json')?.remove();
    try {
      await navigator.clipboard!.writeText(json);
      mensaje.textContent = 'Copiado';
    } catch {
      // Sin portapapeles (p. ej. http en la red local): caja de texto para copiar a mano.
      const caja = doc.createElement('textarea');
      caja.id = 'depurar-json';
      caja.readOnly = true;
      caja.value = json;
      mensaje.textContent = 'Cópialo a mano';
      panel.append(caja);
      caja.focus();
      caja.select();
      caja.setSelectionRange(0, caja.value.length);
    }
  });

  boton.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
  });

  doc.body.append(boton, panel);
}

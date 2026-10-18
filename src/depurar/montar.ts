import type Phaser from 'phaser';
import { MuestreadorFrames, instantanea, metricas } from './contadores';
import { exponerJuego } from './depurar';
import { textoOverlay } from './metricas';
import { montarOverlay } from './overlay';
import { leerRecargas, marcarEntrada, marcarSalida, obtenerSesion, registrarArranque } from './recargas';

// Aparte de depurar.ts porque este módulo importa Phaser (vía contadores) y depurar.test.ts no puede.
/** Monta todo lo de `?depurar`: `__juego`, `__depurar`, el conteo de recargas y el overlay. */
export function montarDepurar(game: Phaser.Game): void {
  exponerJuego(game);

  // Recargas inesperadas (ROB-04): la marca se quita en pagehide; si sigue puesta al arrancar, hubo una.
  const sesion = obtenerSesion();
  registrarArranque(sesion);
  window.addEventListener('pagehide', () => marcarSalida(sesion));
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) marcarEntrada(sesion);
  });
  // iOS puede disparar pagehide al ir a segundo plano sin pageshow al volver: al ser visible otra vez, se vuelve a marcar.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') marcarEntrada(sesion);
  });

  const muestreador = new MuestreadorFrames(game);
  const leerInstantanea = () => instantanea(game);
  const leerMetricas = () => metricas(game, muestreador, () => leerRecargas(sesion));
  window.__depurar = { instantanea: leerInstantanea, metricas: leerMetricas };

  montarOverlay(() => textoOverlay(leerInstantanea(), leerMetricas()));
}

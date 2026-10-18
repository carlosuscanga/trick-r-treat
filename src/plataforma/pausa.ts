import type Phaser from 'phaser';

// La pausa tiene varios dueños (hoy: pantalla en vertical y contexto WebGL perdido).
// Sin esto, reanudar por un motivo despausaría el juego aunque otro siga activo.
// Cada dueño activa o quita su propio motivo; el juego solo se reanuda sin motivos.
export type Motivo = 'vertical' | 'contexto';

type Juego = Pick<Phaser.Game, 'pause' | 'resume'>;
type Sonido = { pauseAll(): void; resumeAll(): void };

export type Pausa = {
  activar(motivo: Motivo): void;
  quitar(motivo: Motivo): void;
  activos(): readonly Motivo[];
};

export function crearPausa(game: Juego, sonido: Sonido): Pausa {
  const motivos = new Set<Motivo>();

  return {
    activar(motivo) {
      if (motivos.has(motivo)) return;
      motivos.add(motivo);
      if (motivos.size === 1) {
        game.pause();
        sonido.pauseAll();
      }
    },
    quitar(motivo) {
      if (!motivos.delete(motivo)) return;
      if (motivos.size === 0) {
        game.resume();
        sonido.resumeAll();
      }
    },
    activos: () => [...motivos],
  };
}

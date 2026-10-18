import type Phaser from 'phaser';

// La pausa tiene varios dueños (hoy: pantalla en vertical y contexto WebGL perdido).
// Sin esto, reanudar por un motivo despausaría el juego aunque otro siga activo.
// Cada dueño activa o quita su propio motivo; el juego solo se reanuda sin motivos.
// Al pausar se guardan los sonidos que sonaban y solo esos se reanudan: un sonido
// que el juego pausó a propósito (p. ej. música pausada por un menú) sigue pausado.
export type Motivo = 'vertical' | 'contexto';

type Juego = Pick<Phaser.Game, 'pause' | 'resume'>;
type Pausable = { pause(): unknown; resume(): unknown };
type Sonido = { getAllPlaying(): Pausable[] };

export type Pausa = {
  activar(motivo: Motivo): void;
  quitar(motivo: Motivo): void;
  activos(): readonly Motivo[];
};

export function crearPausa(game: Juego, sonido: Sonido): Pausa {
  const motivos = new Set<Motivo>();
  let pausados: Pausable[] = [];

  return {
    activar(motivo) {
      if (motivos.has(motivo)) return;
      motivos.add(motivo);
      if (motivos.size === 1) {
        game.pause();
        pausados = [...sonido.getAllPlaying()];
        for (const s of pausados) s.pause();
      }
    },
    quitar(motivo) {
      if (!motivos.delete(motivo)) return;
      if (motivos.size === 0) {
        game.resume();
        for (const s of pausados) s.resume();
        pausados = [];
      }
    },
    activos: () => [...motivos],
  };
}

// Detecta ~30 fps sostenidos (el modo de bajo consumo de iOS limita Safari a 30)
// para avisar una sola vez. Solo de la escena de prueba de T-004. Sin Phaser y sin
// asignaciones: se llama una vez por frame.

export class VigiaFps {
  private lentoMs = 0;
  private yaAviso = false;

  constructor(
    private readonly umbralFps = 40,
    private readonly sostenidoMs = 3000,
  ) {}

  /** `true` una sola vez: cuando el fps lleva `sostenidoMs` seguidos bajo el umbral. */
  registrar(dtMs: number): boolean {
    if (this.yaAviso) return false;
    // fps < umbral ⇔ dtMs > 1000 / umbral (sin dividir entre dtMs, que puede ser 0).
    if (dtMs * this.umbralFps <= 1000) {
      this.lentoMs = 0; // un frame bueno reinicia la cuenta
      return false;
    }
    this.lentoMs += dtMs;
    if (this.lentoMs < this.sostenidoMs) return false;
    this.yaAviso = true;
    return true;
  }
}

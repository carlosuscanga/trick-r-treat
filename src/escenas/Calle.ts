import Phaser from 'phaser';
import { ControlTactil } from '../controles/controlTactil';
import type { Disposicion } from '../controles/disposicion';
import { crearIntenciones, limpiarFlancos, type Intenciones } from '../controles/intenciones';
import { DULCES_POR_DIFICULTAD, PUERTAS } from '../datos';
import { ANCHO_CALLE, BLOQUES_CALLE_PRUEBA, X_INICIO, alturaSuperior } from '../datos/plataformas';
import { gameState } from '../estado/GameState';
import { puertaCercana } from '../flujo/flujo';
import { AJUSTES_CAMBIADOS, derivarFisica, topeVertical, type Ajustes, type Fisica } from '../movimiento/ajustes';
import { velocidadCaminar } from '../movimiento/caminar';
import { crearEstadoSalto, pasoSalto, type EstadoSalto, type SalidaSalto } from '../movimiento/salto';
import { ALTO } from '../plataforma/escala';
import { VigiaFps } from '../plataforma/vigiaFps';
import { ControlesTactiles } from './ControlesTactiles';
import { EscenaBase } from './EscenaBase';

// La Calle: Mi vo (un rectángulo) camina con el joystick, salta con altura variable y
// responde a Brazos, sobre cajas grises, con la cámara siguiéndola (T-004). Tiene 8 puertas
// de prueba (T-007): Brazos junto a una no visitada entra a ella; T-008 las dibuja de verdad.

/** Parte superior de la calle (el piso), en y de mundo. */
const PISO = 620;
/** El mundo sube hasta aquí para que quepan el techo y el salto desde él. */
const MUNDO_ARRIBA = -400;
// Empieza a la derecha de la base del joystick en reposo, para que no la tape.
const MI_VO = { x: X_INICIO, ancho: 90, alto: 200 };
const NARANJA = 0xff7a1a;
const BLANCO = 0xffffff;
const COLOR_CALLE = 0x2b2b3a;
const COLOR_BLOQUE = 0x6b6b78;
const COLOR_BORDE = 0x9a9aa8;
// Cámara: sigue en x al instante fuera de la zona muerta y en y con suavidad.
// Con 300 px de alto, los saltitos no la mueven y subir al techo sí.
const LERP_Y = 0.15;
const ZONA_MUERTA_ANCHO = 0.25;
const ZONA_MUERTA_ALTO = 300;
const PROFUNDIDAD_HUD = 1000;
// Puertas placeholder: un rectángulo sobre el piso con su número y sus dulces.
const PUERTA = { ancho: 120, alto: 220, color: 0x8a4b1f, borde: 0xffc27a };
const ALFA_VISITADA = 0.25;

type Rectangulo = Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };

export class Calle extends EscenaBase {
  private cuerpo!: Rectangulo;
  private intencionesVivas!: Intenciones;
  private control!: ControlTactil;
  private tactiles!: ControlesTactiles;
  private ajustes!: Ajustes;
  private fisica!: Fisica;
  private estadoSalto!: EstadoSalto;
  private salida!: SalidaSalto;
  private vigia!: VigiaFps;
  private evento: SalidaSalto['evento'] = null;
  private textoBrazos!: Phaser.GameObjects.Text;
  private avisoFps!: Phaser.GameObjects.Text;
  private tweenBrazos!: Phaser.Tweens.Tween;
  private tweenDestello!: Phaser.Tweens.Tween;
  private tweenAviso!: Phaser.Tweens.Tween;
  private puertasVista: Phaser.GameObjects.GameObject[] = [];
  // Creado una vez: update() no puede crear closures (POO-03).
  private readonly estaVisitada = (indice: number) => gameState.estaVisitada(indice);

  constructor() {
    // Física declarada en la escena (ESC-07), a 120 pasos fijos por segundo, con la
    // gravedad por cuerpo (la pone el salto) y no de mundo.
    super({ key: 'Calle', physics: { arcade: { fps: 120, gravity: { x: 0, y: 0 } } } });
  }

  // Solo lectura, para los e2e.
  get miVo(): Rectangulo {
    return this.cuerpo;
  }
  get intenciones(): Intenciones {
    return this.intencionesVivas;
  }
  get controles(): ControlTactil {
    return this.control;
  }
  /** El último `evento` del salto que no fue null. */
  get ultimoEvento(): SalidaSalto['evento'] {
    return this.evento;
  }
  get disposicion(): Disposicion {
    return this.tactiles.disposicion;
  }
  /** Índice de la puerta no visitada al alcance de Mi vo, o null. */
  get puertaAlAlcance(): number | null {
    return puertaCercana(this.cuerpo.x, PUERTAS.puertas, this.estaVisitada, PUERTAS.radio);
  }

  /** Id del disfraz elegido, o null (solo lectura, para los e2e). */
  get disfrazId(): string | null {
    return gameState.disfraz?.id ?? null;
  }

  init(data?: unknown) {
    super.init(data);
    // start/restart reusan la instancia: el estado empieza de cero aquí (ESC-03).
    this.estadoSalto = crearEstadoSalto();
    this.intencionesVivas = crearIntenciones();
    this.vigia = new VigiaFps();
    this.evento = null;
    this.puertasVista = [];
  }

  create() {
    // Objeto vivo: el panel ?depurar lo cambia en su lugar y avisa con AJUSTES_CAMBIADOS.
    this.ajustes = this.registry.get('ajustes') as Ajustes;
    this.fisica = derivarFisica(this.ajustes.salto);
    this.salida = { vy: null, gravedad: 0, evento: null };

    this.physics.world.setBounds(0, MUNDO_ARRIBA, ANCHO_CALLE, ALTO - MUNDO_ARRIBA);
    const solidos = this.crearCalle();
    this.crearPuertas();
    this.crearMiVo(solidos);

    const camara = this.cameras.main;
    camara.setBounds(0, MUNDO_ARRIBA, ANCHO_CALLE, ALTO - MUNDO_ARRIBA);
    camara.startFollow(this.cuerpo, true, 1, LERP_Y);

    this.control = new ControlTactil(this.intencionesVivas, this.ajustes);
    this.tactiles = new ControlesTactiles(this, this.control, this.ajustes);
    this.crearAvisos();
    this.reacomodar();
    this.atenuarVisitadas();

    this.escuchar(this.scale, Phaser.Scale.Events.RESIZE, this.alCambiarTamano);
    this.escuchar(this.game.events, Phaser.Core.Events.HIDDEN, this.soltarTodo);
    this.escuchar(this.game.events, Phaser.Core.Events.BLUR, this.soltarTodo);
    this.escuchar(this.game.events, AJUSTES_CAMBIADOS, this.alCambiarAjustes);

    // WAKE y SLEEP son de la propia escena: se quitan al apagarla (ESC-02), no con escuchar().
    this.events.on(Phaser.Scenes.Events.WAKE, this.alDespertar, this);
    this.events.on(Phaser.Scenes.Events.SLEEP, this.soltarTodo, this);
    this.alLimpiar(() => {
      this.events.off(Phaser.Scenes.Events.WAKE, this.alDespertar, this);
      this.events.off(Phaser.Scenes.Events.SLEEP, this.soltarTodo, this);
    });
  }

  // Sin asignaciones (POO-03): todo lo que usa se creó en init() o create().
  // Arcade ya avanzó en el evento UPDATE, antes de este método: lo que se aplica
  // aquí lo usa el siguiente paso de la física (≤ 1 frame, ver "Riesgos y dudas").
  update(_t: number, delta: number) {
    const i = this.intencionesVivas;
    const body = this.cuerpo.body;

    this.tactiles.revisar();
    body.setVelocityX(velocidadCaminar(i.direccion, i.fuerza, this.ajustes.caminar));

    // vy >= 0: si blocked.down llega un frame tarde tras despegar, no hay doble salto.
    const enSuelo = body.blocked.down && body.velocity.y >= 0;
    const s = pasoSalto(this.estadoSalto, enSuelo, body.velocity.y, i.saltarPresionado, i.saltarSostenido, delta, this.fisica, this.salida);
    if (s.vy !== null) body.setVelocityY(s.vy);
    body.setGravityY(s.gravedad);
    // El tope de Arcade es max(caidaMax, v0) para no recortar la subida: la caída se limita aquí.
    if (body.velocity.y > this.fisica.caidaMax) body.velocity.y = this.fisica.caidaMax;
    if (s.evento !== null) this.evento = s.evento;

    if (i.brazosPresionado) {
      const puerta = this.puertaAlAlcance;
      if (puerta !== null) this.entrarAPuerta(puerta);
      else this.destelloBrazos();
    }
    if (this.vigia.registrar(delta)) {
      this.avisoFps.setVisible(true);
      this.tweenAviso.restart();
    }
    limpiarFlancos(i);
  }

  /** La calle y sus bloques: rectángulos con cuerpo estático. */
  private crearCalle(): Phaser.Physics.Arcade.StaticGroup {
    const solidos = this.physics.add.staticGroup();
    solidos.add(this.add.rectangle(ANCHO_CALLE / 2, (PISO + ALTO) / 2, ANCHO_CALLE, ALTO - PISO, COLOR_CALLE));

    const estilo = { fontSize: '16px', color: '#e6e6f0' };
    for (const b of BLOQUES_CALLE_PRUEBA) {
      const arriba = PISO - alturaSuperior(b, BLOQUES_CALLE_PRUEBA);
      const caja = this.add.rectangle(b.x + b.ancho / 2, arriba + b.alto / 2, b.ancho, b.alto, COLOR_BLOQUE);
      solidos.add(caja.setStrokeStyle(2, COLOR_BORDE));
      this.add.text(b.x + 6, arriba + 4, b.nombre, estilo);
    }
    return solidos;
  }

  /** Las 8 puertas de PUERTAS como rectángulos sobre el piso; se crean una vez. */
  private crearPuertas(): void {
    const estilo = { fontSize: '26px', color: '#ffffff', align: 'center', fontStyle: 'bold' };
    PUERTAS.puertas.forEach((puerta, i) => {
      const caja = this.add
        .rectangle(puerta.x, PISO - PUERTA.alto / 2, PUERTA.ancho, PUERTA.alto, PUERTA.color)
        .setStrokeStyle(3, PUERTA.borde);
      const dulces = DULCES_POR_DIFICULTAD[puerta.dificultad];
      const texto = this.add
        .text(puerta.x, PISO - PUERTA.alto + 16, `Casa ${i + 1}\n${dulces} ${dulces === 1 ? 'dulce' : 'dulces'}`, estilo)
        .setOrigin(0.5, 0);
      this.puertasVista.push(caja, texto);
    });
  }

  /** Atenúa las puertas ya visitadas (placeholder; T-008 las dibuja de verdad). */
  private atenuarVisitadas(): void {
    for (let i = 0; i < PUERTAS.puertas.length; i++) {
      const alfa = gameState.estaVisitada(i) ? ALFA_VISITADA : 1;
      (this.puertasVista[2 * i] as Phaser.GameObjects.Rectangle).setAlpha(alfa);
      (this.puertasVista[2 * i + 1] as Phaser.GameObjects.Text).setAlpha(alfa);
    }
  }

  /** Duerme la Calle (Mi vo se queda donde está) y abre la Puerta de esa casa. */
  private entrarAPuerta(indice: number): void {
    this.scene.sleep();
    this.scene.launch('Puerta', { casa: indice });
  }

  private alDespertar(): void {
    this.atenuarVisitadas();
  }

  private crearMiVo(solidos: Phaser.Physics.Arcade.StaticGroup): void {
    const rect = this.add.rectangle(MI_VO.x, PISO - MI_VO.alto / 2, MI_VO.ancho, MI_VO.alto, NARANJA);
    this.physics.add.existing(rect);
    this.cuerpo = rect as Rectangulo;
    this.cuerpo.body
      .setCollideWorldBounds(true)
      .setBounce(0, 0)
      .setMaxVelocity(this.ajustes.caminar.velocidad, topeVertical(this.fisica));
    this.physics.add.collider(this.cuerpo, solidos);
  }

  /** "¡Brazos!", el destello de Mi vo y el aviso de fps, con tweens creados una vez. */
  private crearAvisos(): void {
    this.textoBrazos = this.add
      .text(0, 0, '¡Brazos!', { fontSize: '36px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(10);
    this.tweenBrazos = this.tweens.add({
      targets: this.textoBrazos,
      alpha: { from: 1, to: 0 },
      duration: 600,
      paused: true,
      persist: true,
    });
    this.tweenDestello = this.tweens.add({
      targets: this.cuerpo,
      alpha: { from: 0.6, to: 1 },
      duration: 180,
      paused: true,
      persist: true,
      onComplete: () => this.cuerpo.setFillStyle(NARANJA),
    });

    this.avisoFps = this.add
      .text(0, 56, 'Modo de bajo consumo: el juego puede ir a 30 fps', {
        fontSize: '22px',
        color: '#ffd9a0',
        backgroundColor: '#000000aa',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(PROFUNDIDAD_HUD)
      .setVisible(false);
    this.tweenAviso = this.tweens.add({
      targets: this.avisoFps,
      alpha: { from: 1, to: 0 },
      delay: 6000,
      duration: 800,
      paused: true,
      persist: true,
    });
  }

  private destelloBrazos(): void {
    this.cuerpo.setFillStyle(BLANCO);
    this.tweenDestello.restart();
    this.textoBrazos.setPosition(this.cuerpo.x, this.cuerpo.y - MI_VO.alto / 2 - 30);
    this.tweenBrazos.restart();
  }

  /** Al cambiar el tamaño (barras de Safari, giro) o los ajustes. No suelta los dedos. */
  private reacomodar(): void {
    const { width, height } = this.scale.gameSize;
    this.tactiles.reacomodar(width, height);
    this.cameras.main.setDeadzone(width * ZONA_MUERTA_ANCHO, ZONA_MUERTA_ALTO);
    this.avisoFps.setX(width / 2);
  }

  /** RESIZE: reacomoda y reancla el joystick, cuyo dedo se mide ahora con otra escala. */
  private alCambiarTamano(): void {
    this.reacomodar();
    this.tactiles.reanclar();
  }

  private soltarTodo(): void {
    this.control.soltarTodo();
  }

  private alCambiarAjustes(): void {
    this.fisica = derivarFisica(this.ajustes.salto);
    this.cuerpo.body.setMaxVelocity(this.ajustes.caminar.velocidad, topeVertical(this.fisica));
    this.reacomodar();
  }
}

# Concepto

## De qué trata

Mi vo elige un disfraz de Halloween y recorre su calle pidiendo dulces. Cada vecino le pone un reto (un minijuego): si gana, le da dulces, y si pierde, le da un susto. Entre casa y casa puede curiosear por el vecindario buscando dulces escondidos. Para ganar tiene que llenar su calavera con 10 dulces antes de llevarse 3 sustos.

## Cómo se juega

- En el celular, desde el navegador y con el teléfono en horizontal. Si el teléfono está vertical, el juego pide girarlo.
- Basta con abrir un link: no hay que instalar nada ni crear cuentas. En iPhone se puede añadir a la pantalla de inicio (Safari → Compartir → Añadir a pantalla de inicio) para abrirlo a pantalla completa, como una app.
- Una partida dura de 10 a 15 minutos, y cada partida es distinta.

## Vista

Vista lateral en 2D: Mi vo camina por la calle hacia los lados y la cámara la sigue. El fondo tiene capas que se mueven a distinta velocidad (parallax): el cielo con la luna casi no se mueve, las casas lejanas se mueven lento y la calle se mueve al paso de Mi vo. Esto da sensación de profundidad.

```
cielo + luna        ░░░░░░░░░🌕░░░░░░░░   (casi fija)
casas lejanas       ▲▲  ▲▲▲   ▲▲  ▲▲▲     (lenta)
calle principal  🏠  🌳  🚗  🏠  🌳  🏠   (al paso de Mi vo)
```

## Controles

En la calle:

- **Joystick** (izquierda): mueve a Mi vo a la izquierda o la derecha, y la sube o la baja cuando está trepando.
- **Saltar** (derecha).
- **Brazos** (derecha): hace una cosa distinta según dónde esté Mi vo: se engancha a un árbol para trepar, golpea un objeto o toca una puerta.

```
┌─────────────────────────────────────┐
│ 🍬 6/10   👻👻○                      │
│        🏠      🌳       🏠           │
│              Mi vo                   │
│  ◜◝                          (🤲)   │
│ ( ● )                    (⬆)        │
│  ◟◞                                 │
└─────────────────────────────────────┘
 joystick              saltar  brazos
```

En los minijuegos, cada uno usa toques directos en la pantalla.

## Flujo de pantallas

```
Menú → Elegir disfraz → Calle (explorar / elegir casa)
                          ↓
                       Puerta → Minijuego → Resultado (dulces o susto)
                          ↑                        ↓
                          └──────── Calle ←────────┘
                                      ↓
                          Fin (victoria o derrota) → Jugar otra vez
```

## Estilo visual

Tierno y caricaturesco, con paleta oscura. Inspirado en los colores de Gravity Falls: morados, azules profundos, naranjas cálidos de calabaza y contrastes de luz nocturna.

## Tono

Cómico y espeluznante, nunca terrorífico. Los sustos dan risa, no miedo.

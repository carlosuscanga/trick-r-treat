// Detector de fugas: compara dos instantáneas de contadores. Sin Phaser.

export type Contadores = Readonly<Record<string, number>>;

export interface Crecimiento {
  clave: string;
  antes: number;
  despues: number;
}

/** Claves de `despues` que crecieron respecto a `antes` (una clave nueva cuenta desde 0). Bajar no es fuga. */
export function crecimientos(antes: Contadores, despues: Contadores): Crecimiento[] {
  const lista: Crecimiento[] = [];
  for (const clave of Object.keys(despues)) {
    const previo = antes[clave] ?? 0;
    if (despues[clave] > previo) lista.push({ clave, antes: previo, despues: despues[clave] });
  }
  return lista;
}

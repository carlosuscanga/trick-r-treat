// Safari de iPhone lanza eventos propios de gestos (pellizcar, girar con dos dedos)
// que acercan la página aunque el CSS diga `touch-action: none`. Se cancelan en el
// documento. Los listeners no son pasivos: un listener pasivo no puede cancelar.
const GESTOS = ['gesturestart', 'gesturechange', 'gestureend'] as const;

export function bloquearGestos(doc: Pick<Document, 'addEventListener'>) {
  for (const tipo of GESTOS) {
    doc.addEventListener(tipo, (e: Event) => e.preventDefault(), { passive: false });
  }
}

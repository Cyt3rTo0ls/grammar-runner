# Grammar Runner · Word Switch

Juego tipo *endless runner* para **aprender inglés desde cero**. El personaje corre solo
por 3 carriles y tú eliges la puerta con la palabra correcta.

Pensado para alguien que **no sabe inglés todavía**: cada nivel empieza con su vocabulario,
las frases aparecen en español y en inglés, y cada respuesta te muestra su significado.

Funciona en **laptop** (teclado) y en **iPad / tablets** (deslizando el dedo o con los
botones en pantalla). No necesita internet ni instalar nada: HTML, CSS y JavaScript puro.

**Jugar en línea:** https://cyt3rto0ls.github.io/grammar-runner/

---

## Cómo se juega

1. **Primero el vocabulario.** Antes de cada nivel aparece la lista de palabras con su
   significado (y un altavoz para escuchar la pronunciación en inglés).
2. **Lee la pista.** Arriba verás la frase en español y debajo la misma frase en inglés,
   con un espacio en blanco `___`. Esa es la palabra que tienes que encontrar.
3. **Elige la puerta.** Tres puertas con palabras en inglés vienen hacia ti.
   - **Laptop:** flechas `↑` `↓` o las teclas `W` / `S`.
   - **iPad:** desliza el dedo hacia arriba o hacia abajo, o toca los botones de la esquina.
4. **Gana o aprende.** Si cruzas la puerta correcta ganas 10 puntos (más bonus por racha).
   Si fallas pierdes una vida y te mostramos la respuesta correcta con su significado y una
   explicación corta.

Otras teclas: `P` o `Esc` = pausa · `M` = silenciar sonido.

### ¿Por qué no se traduce sola la página?
El navegador (Firefox, Chrome, Safari) a veces traduce las palabras en inglés de la página y
rompería el juego. Por eso el documento lleva `translate="no"` y
`<meta name="google" content="notranslate">`: lo que ves en inglés **se queda en inglés**.

## Niveles

| Nivel | Tema | Qué se aprende |
|-------|------|----------------|
| 1 | **Pronombres personales** | I, you, he, she, it, we, they |
| 2 | **Posesivos: My o Mine** | cuándo va antes del objeto y cuándo va solo |
| 3 | **Verbos irregulares** | presente y pasado (DRINK / DRANK) esquivando los falsos |

Cada nivel dura entre 1 y 2 minutos, así que en 10 minutos repites las palabras decenas
de veces. Al terminar el nivel 3, el juego vuelve al nivel 1 un poco más rápido.

## Tutorial

Toca **Ver el tutorial**. Son 6 pasos cortos en español de Latinoamérica y termina con una
**práctica guiada** donde el juego marca en verde el carril correcto. Ahí no se pierden vidas.

---

## Cómo usarlo

### Opción 1: jugar en línea
Abre https://cyt3rto0ls.github.io/grammar-runner/ desde la laptop o el iPad.

### Opción 2: abrir el archivo directamente
Haz doble clic en `index.html`.

### Opción 3: servidor local (útil para el iPad)
```bash
python3 -m http.server 8000
```
Luego entra desde el iPad a `http://IP-DE-TU-COMPUTADORA:8000`.

> En el iPad puedes añadirlo a la pantalla de inicio (Compartir → Añadir a pantalla de
> inicio) y se abre a pantalla completa, como una app.

---

## Estructura

```
grammar-runner/
├── index.html          Estructura, menú, vocabulario, tutorial y pantallas
├── css/styles.css      Estilos responsive (laptop, iPad horizontal y vertical)
├── js/questions.js     Contenido educativo: niveles, vocabulario y preguntas
├── js/icons.js         Iconos SVG (Lucide, licencia ISC) incluidos sin dependencias
└── js/game.js          Motor: canvas, 3 carriles, puertas, partículas y sonido
```

### Agregar o cambiar preguntas
Todo el contenido está en `js/questions.js`. Para añadir una pregunta:

```js
{
  icon: 'bike',                          // icono de la pista
  es: 'Esa es ___ bicicleta.',           // frase en español
  en: 'That is ___ bike.',               // la misma frase en inglés
  cue: 'mi (antes del objeto)',          // pista corta
  options: ['My', 'Mine', 'Me'],         // las 3 puertas
  correct: 0,                            // índice de la correcta
  meaning: 'My = mi',                    // qué significa
  explain: '«My» va ANTES del objeto.'   // explicación al acertar o fallar
}
```

Y si la palabra es nueva, agrégala a la lista `vocab` de ese nivel para que se enseñe antes
de jugar. Las opciones se mezclan al azar en cada partida, así que la puerta correcta no
queda siempre en el mismo carril.

Los iconos disponibles están en `js/icons.js` (por ejemplo `bike`, `dog`, `book`, `camera`,
`eye`, `bed`). Si pones un nombre que no existe, se usa un icono genérico.

---

## Créditos y licencias

- **Iconos:** [Lucide](https://lucide.dev) — licencia ISC. Están incluidos como SVG dentro
  de `js/icons.js`, así que el juego no depende de ninguna CDN.
- **Sonido y voz:** generados por el navegador (Web Audio API y `speechSynthesis`), sin
  archivos externos.
- El resto del código es propio y no tiene dependencias.

## Nota para desarrollo

`js/game.js` expone `window.GRAMMAR_RUNNER` para probar desde la consola del navegador:

```js
GRAMMAR_RUNNER.startGame();    // empezar desde el vocabulario
GRAMMAR_RUNNER.startLevel(2);  // ir directo al nivel 3, sin vocabulario
GRAMMAR_RUNNER.openVocab(0);   // ver el vocabulario del nivel 1
GRAMMAR_RUNNER.state;          // puntaje, vidas, carril, puertas en pantalla
```

# 🏃‍♂️🚪 Grammar Runner: Word Switch

Juego tipo *endless runner* para **aprender inglés jugando**. El personaje corre solo por
3 carriles y tú eliges la puerta con la palabra correcta en inglés.

Funciona en **laptop** (teclado) y en **iPad / tablets** (deslizando el dedo o con los
botones en pantalla). No necesita internet ni instalar nada: es HTML, CSS y JavaScript puro.

---

## 🎮 Cómo se juega

1. Arriba aparece un **dibujo** y una **frase en español** con un espacio en blanco `___`.
2. Corren hacia ti **3 puertas**, cada una con una palabra en inglés.
3. Muévete al carril de la puerta correcta antes de que te alcance:
   - **Laptop:** flechas `↑` `↓` o las teclas `W` / `S`.
   - **iPad:** desliza el dedo hacia arriba o hacia abajo, o toca los botones ⬆️ ⬇️.
4. Si cruzas la puerta correcta ganas **10 puntos** (con bonus por racha 🔥).
5. Si chocas, pierdes una vida ❤️ y te aparece un **recordatorio** con la explicación.

Otras teclas: `P` o `Esc` = pausa · `M` = silenciar sonido.

## 🗂️ Niveles

| Nivel | Tema | Qué se aprende |
|-------|------|----------------|
| 1 | **Pronombres personales** | I, you, he, she, it, we, they |
| 2 | **Posesivos (My vs. Mine)** | cuándo va antes del objeto y cuándo va solo |
| 3 | **Laboratorio de verbos irregulares** | presente ➜ pasado (DRINK ➜ DRANK) esquivando los falsos |

Cada nivel dura entre 1 y 2 minutos, así que en 10 minutos repites las palabras
decenas de veces. Al terminar el nivel 3, el juego vuelve al nivel 1 un poco más rápido.

## 📖 Tutorial

Al abrir el juego toca **📖 Tutorial (español)**. Son 5 pasos cortos y termina con una
**práctica guiada** donde el juego te marca en verde el carril correcto. No se pierden
vidas en la práctica.

---

## 🚀 Cómo usarlo

### Opción 1: abrir el archivo directamente
Haz doble clic en `index.html`. Funciona en cualquier navegador moderno.

### Opción 2: servidor local (recomendado para iPad)
En la carpeta del proyecto:

```bash
python3 -m http.server 8000
```

Luego entra desde el iPad a `http://IP-DE-TU-COMPUTADORA:8000`.

### Opción 3: jugar en línea (ya está publicado) 👉 https://cyt3rto0ls.github.io/grammar-runner/

Ese enlace ya funciona y se abre directo en el iPad o en la laptop, sin instalar nada.

Si quieres publicarlo desde otro repositorio: `Settings ➜ Pages ➜ Source: Deploy from a
branch ➜ main / (root) ➜ Save`. En un par de minutos el juego queda en
`https://TU-USUARIO.github.io/grammar-runner/`.

> En el iPad puedes añadirlo a la pantalla de inicio (Compartir ➜ Añadir a pantalla de
> inicio) y se abre a pantalla completa como una app.

---

## 📁 Estructura

```
grammar-runner/
├── index.html          Estructura, menú, tutorial y pantallas
├── css/styles.css      Estilos responsive (laptop, iPad horizontal y vertical)
├── js/questions.js     Contenido educativo: niveles, preguntas y pasos del tutorial
└── js/game.js          Motor del juego: canvas, 3 carriles, puertas, partículas y sonido
```

### Agregar o cambiar preguntas
Todo el contenido está en `js/questions.js`. Para añadir una pregunta:

```js
{
  emoji: '🚲',                                   // el dibujo
  sentence: 'Esa es ___ bicicleta.',             // frase con el espacio en blanco
  hint: '(mi + objeto)',                         // pista corta
  options: ['My', 'Mine', 'Me'],                 // las 3 puertas
  correct: 0,                                    // índice de la correcta
  explain: '«My» va ANTES del objeto.'           // recordatorio al acertar o fallar
}
```

Las opciones se **mezclan al azar** en cada partida, así que la puerta correcta nunca
queda siempre en el mismo carril.

---

## 🛠️ Nota para desarrollo

`js/game.js` expone `window.GRAMMAR_RUNNER` para probar desde la consola del navegador:

```js
GRAMMAR_RUNNER.startGame();    // empezar a jugar
GRAMMAR_RUNNER.startLevel(2);  // ir directo al nivel 3
GRAMMAR_RUNNER.state;          // ver puntaje, vidas, carriles, etc.
```

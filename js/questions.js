/* ============================================================
   Grammar Runner: Word Switch
   Contenido educativo (niveles y preguntas)
   ------------------------------------------------------------
   Cada pregunta tiene:
     emoji    -> el "dibujo" que se muestra arriba
     sentence -> la frase en español con el espacio en blanco ___
     hint     -> pista corta en español (por ejemplo, "(Él)")
     pattern  -> etiqueta del nivel 3 (tipo de cambio del verbo)
     options  -> 3 palabras en inglés (se mezclan al jugar)
     correct  -> índice de la opción correcta
     explain  -> recordatorio corto que se muestra si fallas o aciertas
   ============================================================ */

const LEVELS = [
  /* ---------------- NIVEL 1: Pronombres personales ---------------- */
  {
    id: 1,
    title: 'Pronombres Personales',
    subtitle: 'Paso 1 · ¿Quién hace la acción?',
    tag: 'Elige el pronombre correcto',
    mode: 'gate',
    speed: 1.0,
    color: '#38bdf8',
    items: [
      {
        emoji: '🏃',
        sentence: '___ corro todos los días.',
        hint: '(Yo)',
        options: ['I', 'You', 'She'],
        correct: 0,
        explain: '«I» significa «yo». En inglés siempre va con mayúscula.'
      },
      {
        emoji: '🙋',
        sentence: '___ eres muy amable.',
        hint: '(Tú)',
        options: ['He', 'You', 'They'],
        correct: 1,
        explain: '«You» significa «tú» y también «ustedes».'
      },
      {
        emoji: '👦',
        sentence: '___ corre muy rápido.',
        hint: '(Él)',
        options: ['She', 'It', 'He'],
        correct: 2,
        explain: '«He» significa «él».'
      },
      {
        emoji: '👩',
        sentence: '___ habla por teléfono.',
        hint: '(Ella)',
        options: ['She', 'He', 'We'],
        correct: 0,
        explain: '«She» significa «ella».'
      },
      {
        emoji: '🐶',
        sentence: 'El perro es pequeño, ___ es rápido.',
        hint: '(para cosas o animales)',
        options: ['It', 'They', 'I'],
        correct: 0,
        explain: '«It» se usa para cosas, animales o ideas en singular.'
      },
      {
        emoji: '⚽',
        sentence: '___ jugamos fútbol el domingo.',
        hint: '(Nosotros)',
        options: ['They', 'We', 'You'],
        correct: 1,
        explain: '«We» significa «nosotros».'
      },
      {
        emoji: '👨‍👩‍👧',
        sentence: '___ son mis vecinos.',
        hint: '(Ellos)',
        options: ['We', 'She', 'They'],
        correct: 2,
        explain: '«They» significa «ellos» o «ellas».'
      }
    ]
  },

  /* ---------------- NIVEL 2: Posesivos ---------------- */
  {
    id: 2,
    title: 'Posesivos: My o Mine',
    subtitle: 'Paso 2 · ¿Va antes del objeto o va solo?',
    tag: '¿Adjetivo posesivo o pronombre posesivo?',
    mode: 'gate',
    speed: 1.08,
    color: '#a78bfa',
    items: [
      {
        emoji: '🚲',
        sentence: 'Esa es ___ bicicleta.',
        hint: '(mi + objeto)',
        options: ['My', 'Mine', 'Me'],
        correct: 0,
        explain: '«My» va ANTES del objeto: my bike = mi bicicleta.'
      },
      {
        emoji: '🚲',
        sentence: 'Esa bicicleta es ___.',
        hint: '(mía, sin objeto)',
        options: ['My', 'Mine', 'Me'],
        correct: 1,
        explain: '«Mine» va SOLO, sin objeto: the bike is mine = la bicicleta es mía.'
      },
      {
        emoji: '📚',
        sentence: 'Este es ___ libro favorito.',
        hint: '(mi + objeto)',
        options: ['Mine', 'My', 'I'],
        correct: 1,
        explain: '«My» va antes del objeto: my book = mi libro.'
      },
      {
        emoji: '📚',
        sentence: 'Ese libro es ___.',
        hint: '(mío, sin objeto)',
        options: ['Me', 'Mine', 'My'],
        correct: 1,
        explain: '«Mine» va solo: the book is mine = el libro es mío.'
      },
      {
        emoji: '👟',
        sentence: 'Esos zapatos son ___.',
        hint: '(tuyos, sin objeto)',
        options: ['Your', 'Yours', 'You'],
        correct: 1,
        explain: '«Yours» va solo: the shoes are yours = los zapatos son tuyos.'
      },
      {
        emoji: '🎒',
        sentence: 'Está en ___ mochila.',
        hint: '(tu + objeto)',
        options: ['Your', 'Yours', 'You'],
        correct: 0,
        explain: '«Your» va antes del objeto: your backpack = tu mochila.'
      },
      {
        emoji: '🏠',
        sentence: 'La casa roja es ___.',
        hint: '(nuestra, sin objeto)',
        options: ['Our', 'Ours', 'Us'],
        correct: 1,
        explain: '«Ours» va solo: the red house is ours = la casa roja es nuestra.'
      }
    ]
  },

  /* ---------------- NIVEL 3: Verbos irregulares ---------------- */
  {
    id: 3,
    title: 'Laboratorio de Verbos Irregulares',
    subtitle: 'Paso 3 · Presente ➜ Pasado',
    tag: 'Atrapa el pasado correcto',
    mode: 'collect',
    speed: 1.15,
    color: '#f472b6',
    items: [
      {
        emoji: '🥤',
        sentence: 'DRINK',
        hint: 'Presente ➜ busca el Pasado',
        pattern: 'Patrón ABC · cambia solo una letra',
        options: ['drank', 'drinked', 'dronk'],
        correct: 0,
        explain: 'DRINK ➜ DRANK ➜ DRUNK. ¡Cambia solo una letra! Nunca «drinked».'
      },
      {
        emoji: '🍔',
        sentence: 'EAT',
        hint: 'Presente ➜ busca el Pasado',
        pattern: 'Patrón ABC · la palabra cambia completa',
        options: ['ated', 'ate', 'eaten'],
        correct: 1,
        explain: 'EAT ➜ ATE ➜ EATEN. No digas «eated».'
      },
      {
        emoji: '🚶',
        sentence: 'GO',
        hint: 'Presente ➜ busca el Pasado',
        pattern: 'Forma nueva · no se parece al presente',
        options: ['goed', 'gone', 'went'],
        correct: 2,
        explain: 'GO ➜ WENT ➜ GONE. Nunca «goed».'
      },
      {
        emoji: '👀',
        sentence: 'SEE',
        hint: 'Presente ➜ busca el Pasado',
        pattern: 'Cambia la vocal',
        options: ['saw', 'seed', 'seen'],
        correct: 0,
        explain: 'SEE ➜ SAW ➜ SEEN. No digas «seed».'
      },
      {
        emoji: '🏃',
        sentence: 'RUN',
        hint: 'Presente ➜ busca el Pasado',
        pattern: 'Cambia solo una letra',
        options: ['runned', 'ran', 'ranned'],
        correct: 1,
        explain: 'RUN ➜ RAN ➜ RUN. No digas «runned».'
      },
      {
        emoji: '✍️',
        sentence: 'WRITE',
        hint: 'Presente ➜ busca el Pasado',
        pattern: 'Cambia solo una letra',
        options: ['writed', 'wrote', 'wroten'],
        correct: 1,
        explain: 'WRITE ➜ WROTE ➜ WRITTEN.'
      },
      {
        emoji: '📸',
        sentence: 'TAKE',
        hint: 'Presente ➜ busca el Pasado',
        pattern: 'Cambia solo una letra',
        options: ['took', 'taked', 'tooken'],
        correct: 0,
        explain: 'TAKE ➜ TOOK ➜ TAKEN.'
      },
      {
        emoji: '💥',
        sentence: 'BREAK',
        hint: 'Presente ➜ busca el Pasado',
        pattern: 'Cambia la vocal',
        options: ['breaked', 'broked', 'broke'],
        correct: 2,
        explain: 'BREAK ➜ BROKE ➜ BROKEN.'
      },
      {
        emoji: '🗣️',
        sentence: 'SPEAK',
        hint: 'Presente ➜ busca el Pasado',
        pattern: 'Cambia la vocal',
        options: ['speaked', 'spoke', 'spoked'],
        correct: 1,
        explain: 'SPEAK ➜ SPOKE ➜ SPOKEN.'
      },
      {
        emoji: '😴',
        sentence: 'SLEEP',
        hint: 'Presente ➜ busca el Pasado',
        pattern: 'Cambia la vocal',
        options: ['slept', 'sleeped', 'sleept'],
        correct: 0,
        explain: 'SLEEP ➜ SLEPT ➜ SLEPT. La vocal larga se vuelve corta.'
      }
    ]
  }
];

/* Pasos del tutorial (español de Latinoamérica, simple y corto) */
const TUTORIAL_STEPS = [
  {
    emoji: '👋',
    title: '¡Hola! Bienvenido al juego',
    text: 'Vas a correr por 3 carriles. Arriba aparece una pista en español y tú eliges la puerta con la palabra correcta en inglés. Aprenderás y te divertirás al mismo tiempo.'
  },
  {
    emoji: '⬆️⬇️',
    title: 'Muévete entre los carriles',
    text: 'En la laptop usa las flechas ARRIBA y ABAJO (o las teclas W y S). En el iPad desliza el dedo hacia arriba o hacia abajo, o toca los botones de la esquina.'
  },
  {
    emoji: '🖼️',
    title: 'Lee bien la pista',
    text: 'Arriba verás un dibujo y una frase en español con un espacio en blanco ___. Ese espacio es la palabra en inglés que tienes que encontrar.'
  },
  {
    emoji: '🚪',
    title: 'Cruza la puerta correcta',
    text: 'Cada puerta tiene una palabra en inglés. Si llegas a la puerta correcta ganas 10 puntos. Si chocas con una puerta equivocada pierdes una vida ❤️ y te mostramos un recordatorio para que lo recuerdes.'
  },
  {
    emoji: '🧪',
    title: 'Nivel especial: verbos irregulares',
    text: 'En el laboratorio verás un verbo en presente, como DRINK. Atrapa el pasado correcto (DRANK) y esquiva los falsos (drinked, dronk).'
  },
  {
    emoji: '🎯',
    title: 'Practiquemos una vez',
    text: 'Ahora haz una práctica corta. No pierdes vidas aquí. Te vamos a marcar el carril correcto para que entiendas la mecánica.'
  }
];

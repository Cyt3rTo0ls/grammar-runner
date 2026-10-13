/* ============================================================
   Grammar Runner: Word Switch
   Contenido educativo
   ------------------------------------------------------------
   Cada nivel tiene:
     vocab  -> lista de palabras que se muestran ANTES de jugar
               (la persona primero aprende, después juega)
     items  -> las preguntas

   Cada pregunta tiene:
     icon     nombre del icono que se muestra en la pista
     es       la frase en español, con "___" en el espacio en blanco
     en       la misma frase en inglés (refuerzo y contexto)
     cue      la pista corta en español: el significado que deben encontrar
     options  las 3 palabras en inglés (se mezclan al azar)
     correct  índice de la opción correcta
     meaning  qué significa la palabra correcta
     explain  explicación que se muestra al acertar o al fallar
   ============================================================ */

const LEVELS = [
  /* ======================= NIVEL 1 ======================= */
  {
    id: 1,
    title: 'Pronombres personales',
    subtitle: '¿Quién hace la acción?',
    tag: 'Elige el pronombre correcto',
    mode: 'gate',
    speed: 1.0,
    color: '#3b82f6',
    vocab: [
      { en: 'I', es: 'yo', tip: 'Siempre se escribe con mayúscula.' },
      { en: 'You', es: 'tú / ustedes', tip: 'Sirve para una o varias personas.' },
      { en: 'He', es: 'él', tip: 'Para un hombre o un niño.' },
      { en: 'She', es: 'ella', tip: 'Para una mujer o una niña.' },
      { en: 'It', es: 'eso, él', tip: 'Para cosas, animales o ideas.' },
      { en: 'We', es: 'nosotros', tip: 'Incluye a quien habla.' },
      { en: 'They', es: 'ellos / ellas', tip: 'Para varias personas o cosas.' }
    ],
    items: [
      {
        icon: 'footprints',
        es: '___ corro todos los días.',
        en: '___ run every day.',
        cue: 'yo',
        options: ['I', 'You', 'She'],
        correct: 0,
        meaning: 'I = yo',
        explain: '«I» significa «yo». En inglés siempre se escribe con mayúscula, aunque esté en medio de la frase.'
      },
      {
        icon: 'hand-heart',
        es: '___ eres muy amable.',
        en: '___ are very kind.',
        cue: 'tú',
        options: ['He', 'You', 'They'],
        correct: 1,
        meaning: 'You = tú',
        explain: '«You» significa «tú». Se usa igual para una sola persona o para varias.'
      },
      {
        icon: 'zap',
        es: '___ corre muy rápido.',
        en: '___ runs very fast.',
        cue: 'él',
        options: ['She', 'It', 'He'],
        correct: 2,
        meaning: 'He = él',
        explain: '«He» significa «él». Fíjate que el verbo lleva -s: he runs, she runs, it runs.'
      },
      {
        icon: 'phone',
        es: '___ habla por teléfono.',
        en: '___ talks on the phone.',
        cue: 'ella',
        options: ['She', 'He', 'We'],
        correct: 0,
        meaning: 'She = ella',
        explain: '«She» significa «ella». También lleva el verbo con -s: she talks.'
      },
      {
        icon: 'dog',
        es: 'El perro es pequeño, ___ es rápido.',
        en: 'The dog is small, ___ is fast.',
        cue: 'eso (cosas y animales)',
        options: ['It', 'They', 'I'],
        correct: 0,
        meaning: 'It = eso, él',
        explain: '«It» se usa para cosas, animales o ideas en singular. Para una sola cosa no uses «they».'
      },
      {
        icon: 'volleyball',
        es: '___ jugamos fútbol el domingo.',
        en: '___ play soccer on Sunday.',
        cue: 'nosotros',
        options: ['They', 'We', 'You'],
        correct: 1,
        meaning: 'We = nosotros',
        explain: '«We» significa «nosotros» e incluye a la persona que habla. El verbo va sin -s: we play.'
      },
      {
        icon: 'users',
        es: '___ son mis vecinos.',
        en: '___ are my neighbors.',
        cue: 'ellos',
        options: ['We', 'She', 'They'],
        correct: 2,
        meaning: 'They = ellos / ellas',
        explain: '«They» significa «ellos» o «ellas». Es el plural de he, she y it.'
      }
    ]
  },

  /* ======================= NIVEL 2 ======================= */
  {
    id: 2,
    title: 'Posesivos: My o Mine',
    subtitle: '¿Va antes del objeto o va solo?',
    tag: '¿Adjetivo posesivo o pronombre posesivo?',
    mode: 'gate',
    speed: 1.06,
    color: '#7c3aed',
    vocab: [
      { en: 'My', es: 'mi', tip: 'Va ANTES del objeto: my bike (mi bicicleta).' },
      { en: 'Mine', es: 'mío / mía', tip: 'Va SOLO, sin objeto: it is mine (es mía).' },
      { en: 'Your', es: 'tu', tip: 'Va ANTES del objeto: your backpack (tu mochila).' },
      { en: 'Yours', es: 'tuyo / tuya', tip: 'Va SOLO: it is yours (es tuyo).' },
      { en: 'Our', es: 'nuestro', tip: 'Va ANTES del objeto: our house (nuestra casa).' },
      { en: 'Ours', es: 'nuestro / nuestra', tip: 'Va SOLO: it is ours (es nuestra).' },
      { en: 'Me', es: 'me / a mí', tip: 'No marca posesión. Ejemplo: give it to me.' }
    ],
    items: [
      {
        icon: 'bike',
        es: 'Esa es ___ bicicleta.',
        en: 'That is ___ bike.',
        cue: 'mi (antes del objeto)',
        options: ['My', 'Mine', 'Me'],
        correct: 0,
        meaning: 'My = mi',
        explain: '«My» va ANTES del objeto: my bike = mi bicicleta. Nunca digas «mine bike».'
      },
      {
        icon: 'bike',
        es: 'Esa bicicleta es ___.',
        en: 'That bike is ___.',
        cue: 'mía (va sola)',
        options: ['My', 'Mine', 'Me'],
        correct: 1,
        meaning: 'Mine = mío / mía',
        explain: '«Mine» va SOLO, sin objeto: that bike is mine = esa bicicleta es mía.'
      },
      {
        icon: 'book',
        es: 'Este es ___ libro favorito.',
        en: 'This is ___ favorite book.',
        cue: 'mi (antes del objeto)',
        options: ['Mine', 'My', 'I'],
        correct: 1,
        meaning: 'My = mi',
        explain: '«My» va antes del objeto: my book = mi libro.'
      },
      {
        icon: 'book-open',
        es: 'Ese libro es ___.',
        en: 'That book is ___.',
        cue: 'mío (va solo)',
        options: ['Me', 'Mine', 'My'],
        correct: 1,
        meaning: 'Mine = mío / mía',
        explain: '«Mine» va solo: that book is mine = ese libro es mío.'
      },
      {
        icon: 'footprints',
        es: 'Esos zapatos son ___.',
        en: 'Those shoes are ___.',
        cue: 'tuyos (va solo)',
        options: ['Your', 'Yours', 'You'],
        correct: 1,
        meaning: 'Yours = tuyo / tuya',
        explain: '«Yours» va solo: the shoes are yours = los zapatos son tuyos.'
      },
      {
        icon: 'backpack',
        es: 'Está en ___ mochila.',
        en: 'It is in ___ backpack.',
        cue: 'tu (antes del objeto)',
        options: ['Your', 'Yours', 'You'],
        correct: 0,
        meaning: 'Your = tu',
        explain: '«Your» va antes del objeto: your backpack = tu mochila.'
      },
      {
        icon: 'house',
        es: 'La casa roja es ___.',
        en: 'The red house is ___.',
        cue: 'nuestra (va sola)',
        options: ['Our', 'Ours', 'Us'],
        correct: 1,
        meaning: 'Ours = nuestro / nuestra',
        explain: '«Ours» va solo: the red house is ours = la casa roja es nuestra.'
      }
    ]
  },

  /* ======================= NIVEL 3 ======================= */
  {
    id: 3,
    title: 'Verbos irregulares',
    subtitle: 'Presente y pasado',
    tag: 'Atrapa el pasado correcto',
    mode: 'collect',
    speed: 1.12,
    color: '#f59e0b',
    vocab: [
      { en: 'drink / drank / drunk', es: 'beber', tip: 'Cambia solo una letra.' },
      { en: 'eat / ate / eaten', es: 'comer', tip: 'La palabra cambia completa.' },
      { en: 'go / went / gone', es: 'ir', tip: 'Forma nueva, no se parece.' },
      { en: 'see / saw / seen', es: 'ver', tip: 'Cambia la vocal.' },
      { en: 'run / ran / run', es: 'correr', tip: 'Cambia una letra.' },
      { en: 'write / wrote / written', es: 'escribir', tip: 'Cambia la vocal.' },
      { en: 'take / took / taken', es: 'tomar', tip: 'Cambia una letra.' },
      { en: 'break / broke / broken', es: 'romper', tip: 'Cambia la vocal.' },
      { en: 'speak / spoke / spoken', es: 'hablar', tip: 'Cambia la vocal.' },
      { en: 'sleep / slept / slept', es: 'dormir', tip: 'La vocal larga se vuelve corta.' }
    ],
    items: [
      {
        icon: 'cup-soda',
        es: 'BEBER · ¿cuál es el pasado?',
        en: 'DRINK · what is the past form?',
        cue: 'presente / pasado',
        pattern: 'Cambia solo una letra',
        options: ['drank', 'drinked', 'dronk'],
        correct: 0,
        meaning: 'DRINK / DRANK = bebió',
        explain: 'DRINK / DRANK / DRUNK. ¡Cambia solo una letra! Nunca se dice «drinked».'
      },
      {
        icon: 'utensils',
        es: 'COMER · ¿cuál es el pasado?',
        en: 'EAT · what is the past form?',
        cue: 'presente / pasado',
        pattern: 'La palabra cambia completa',
        options: ['ated', 'ate', 'eaten'],
        correct: 1,
        meaning: 'EAT / ATE = comió',
        explain: 'EAT / ATE / EATEN. No se dice «eated».'
      },
      {
        icon: 'arrow-right',
        es: 'IR · ¿cuál es el pasado?',
        en: 'GO · what is the past form?',
        cue: 'presente / pasado',
        pattern: 'Forma nueva, no se parece',
        options: ['goed', 'gone', 'went'],
        correct: 2,
        meaning: 'GO / WENT = fue',
        explain: 'GO / WENT / GONE. Nunca se dice «goed».'
      },
      {
        icon: 'eye',
        es: 'VER · ¿cuál es el pasado?',
        en: 'SEE · what is the past form?',
        cue: 'presente / pasado',
        pattern: 'Cambia la vocal',
        options: ['saw', 'seed', 'seen'],
        correct: 0,
        meaning: 'SEE / SAW = vio',
        explain: 'SEE / SAW / SEEN. No se dice «seed».'
      },
      {
        icon: 'footprints',
        es: 'CORRER · ¿cuál es el pasado?',
        en: 'RUN · what is the past form?',
        cue: 'presente / pasado',
        pattern: 'Cambia solo una letra',
        options: ['runned', 'ran', 'ranned'],
        correct: 1,
        meaning: 'RUN / RAN = corrió',
        explain: 'RUN / RAN / RUN. No se dice «runned».'
      },
      {
        icon: 'pen-line',
        es: 'ESCRIBIR · ¿cuál es el pasado?',
        en: 'WRITE · what is the past form?',
        cue: 'presente / pasado',
        pattern: 'Cambia la vocal',
        options: ['writed', 'wrote', 'wroten'],
        correct: 1,
        meaning: 'WRITE / WROTE = escribió',
        explain: 'WRITE / WROTE / WRITTEN.'
      },
      {
        icon: 'camera',
        es: 'TOMAR UNA FOTO · ¿cuál es el pasado?',
        en: 'TAKE · what is the past form?',
        cue: 'presente / pasado',
        pattern: 'Cambia una letra',
        options: ['took', 'taked', 'tooken'],
        correct: 0,
        meaning: 'TAKE / TOOK = tomó',
        explain: 'TAKE / TOOK / TAKEN.'
      },
      {
        icon: 'triangle-alert',
        es: 'ROMPER · ¿cuál es el pasado?',
        en: 'BREAK · what is the past form?',
        cue: 'presente / pasado',
        pattern: 'Cambia la vocal',
        options: ['breaked', 'broked', 'broke'],
        correct: 2,
        meaning: 'BREAK / BROKE = rompió',
        explain: 'BREAK / BROKE / BROKEN.'
      },
      {
        icon: 'message-circle',
        es: 'HABLAR · ¿cuál es el pasado?',
        en: 'SPEAK · what is the past form?',
        cue: 'presente / pasado',
        pattern: 'Cambia la vocal',
        options: ['speaked', 'spoke', 'spoked'],
        correct: 1,
        meaning: 'SPEAK / SPOKE = habló',
        explain: 'SPEAK / SPOKE / SPOKEN.'
      },
      {
        icon: 'bed',
        es: 'DORMIR · ¿cuál es el pasado?',
        en: 'SLEEP · what is the past form?',
        cue: 'presente / pasado',
        pattern: 'La vocal larga se vuelve corta',
        options: ['slept', 'sleeped', 'sleept'],
        correct: 0,
        meaning: 'SLEEP / SLEPT = durmió',
        explain: 'SLEEP / SLEPT / SLEPT.'
      }
    ]
  }
];

/* Pasos del tutorial: español de Latinoamérica, simple y corto */
const TUTORIAL_STEPS = [
  {
    icon: 'target',
    title: 'De qué se trata',
    text: 'Vas a correr por 3 carriles y elegir la puerta con la palabra correcta en inglés. Ganas puntos por cada acierto.'
  },
  {
    icon: 'chevron-down',
    title: 'Cómo te mueves',
    text: 'En la laptop usa las flechas ARRIBA y ABAJO, o las teclas W y S. En el iPad desliza el dedo hacia arriba o hacia abajo, o toca los botones de la esquina.'
  },
  {
    icon: 'languages',
    title: 'Las frases son bilingües',
    text: 'Arriba verás la frase en español y debajo la misma frase en inglés. El espacio en blanco es la palabra que tienes que encontrar.'
  },
  {
    icon: 'graduation-cap',
    title: 'Primero el vocabulario',
    text: 'Antes de cada nivel aparece la lista de palabras con su significado. Léela con calma: así ya vas a reconocer las respuestas cuando aparezcan las puertas.'
  },
  {
    icon: 'circle-check',
    title: 'Aciertos y errores',
    text: 'Si cruzas la puerta correcta ganas puntos. Si chocas pierdes una vida y te mostramos el significado de la palabra. Tienes 3 vidas.'
  },
  {
    icon: 'target',
    title: 'Practiquemos una vez',
    text: 'Ahora viene una práctica corta con el carril correcto marcado en verde. Aquí no pierdes vidas: es solo para que entiendas la mecánica.'
  }
];

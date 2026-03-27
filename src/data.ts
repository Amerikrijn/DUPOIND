import type { QuizQuestion } from './types';

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: 'Welke bakker heeft de Stroopwafel uitgevonden in Utrecht?',
    options: ['Jan de Vries', 'Gerard Kamphuisen', 'Pieter Blom', 'Hendrik Smit'],
    correct: 1, city: 'Utrecht', cityId: 'utrecht',
    explanation: 'Gerard Kamphuisen uitgevonden de Stroopwafel in 1810 in Utrecht. Het originele recept is nog steeds geheim! 🍪',
  },
  {
    question: 'Op hoeveel heuvels ligt de stad Lissabon?',
    options: ['5', '7', '9', '12'],
    correct: 1, city: 'Lisbon', cityId: 'lisbon',
    explanation: 'Lissabon ligt op 7 heuvels (sete colinas). De naam miradouro verwijst naar de uitkijkpunten bovenop! 🏔️',
  },
  {
    question: 'Hoe lang is Marina Beach in Chennai (het op-één-na langste stadsstranden van Azië)?',
    options: ['7 km', '13 km', '22 km', '30 km'],
    correct: 2, city: 'Chennai', cityId: 'chennai',
    explanation: 'Marina Beach is 22 km lang en het op-één-na langste stedelijke strand van Azië! Je ziet er altijd kriket! 🏏',
  },
  {
    question: 'Welke muziekstijl is door UNESCO erkend als immaterieel erfgoed van Lissabon?',
    options: ['Samba', 'Flamenco', 'Fado', 'Bossa Nova'],
    correct: 2, city: 'Lisbon', cityId: 'lisbon',
    explanation: 'Fado betekent "lot" of "noodlot" in het Portugees en is de ziel van Lissabon. 🎶',
  },
  {
    question: 'Hoe oud is de Tamilse taal (een van de oudste nog levende talen)?',
    options: ['500 jaar', '1000 jaar', '1500 jaar', 'Meer dan 2000 jaar'],
    correct: 3, city: 'Chennai', cityId: 'chennai',
    explanation: 'Tamil is meer dan 2.000 jaar oud. Sommige moderne woorden zijn bijna identiek aan de oudste versies! 📜',
  },
  {
    question: 'Waarom heeft Utrecht meer fietsen dan inwoners?',
    options: ['Iedereen heeft 2 fietsen', 'Veel toeristen laten hun fiets achter', 'Er zijn parkeergarages speciaal voor fietsen', 'Alle antwoorden zijn correct'],
    correct: 3, city: 'Utrecht', cityId: 'utrecht',
    explanation: 'Utrecht heeft de grootste fietsenstalling ter wereld (Stationsplein, 12.000+ plekken) EN de meeste fietsen per inwoner. 🚲',
  },
  {
    question: 'Wat is "Pastel de Nata" — het meest iconische gebakje van Lissabon?',
    options: ['Een croissant met kaas', 'Een custard-gevuld bladerdeeggebakje', 'Een zoet brood met citroen', 'Een amandeltaartje'],
    correct: 1, city: 'Lisbon', cityId: 'lisbon',
    explanation: 'Pastéis de Nata zijn custard-gevulde bladerdeegbakjes, uitgevonden door monniken in de 18e eeuw. Best te eten bij Pastéis de Belém! 🥐',
  },
  {
    question: 'Welk groot festival wordt gevierd in Chennai (en in heel Tamil Nadu) in april?',
    options: ['Pongal', 'Tamil New Year (Puthuvarusham)', 'Diwali', 'Onam'],
    correct: 1, city: 'Chennai', cityId: 'chennai',
    explanation: 'Tamil New Year (Puthandu) valt op 14 april. Families eten samen, geven geschenken en bidden voor welvaart! 🎊',
  },
];

export const INITIAL_POLLS = [
  {
    id: 'seed-1',
    question: '🍕 Welk eten zou jij meenemen naar een potluck met alle drie de locaties?',
    options: [
      { label: '🧀 Kaas & Stroopwafels (Utrecht)', votes: [] as string[] },
      { label: '🥐 Pastel de Nata (Lisbon)', votes: [] as string[] },
      { label: '🌶️ Masala Chai & Samosas (Chennai)', votes: [] as string[] },
    ],
    author: 'DUPOIND', cityId: 'utrecht', createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-2',
    question: '🌍 Welke locatie zou jij het liefst eens bezoeken?',
    options: [
      { label: '🇳🇱 Utrecht — fietsen & kaasmarkt', votes: [] as string[] },
      { label: '🇵🇹 Lisbon — zon & Fado', votes: [] as string[] },
      { label: '🇮🇳 Chennai — chai & cricket', votes: [] as string[] },
    ],
    author: 'DUPOIND', cityId: 'lisbon', createdAt: new Date().toISOString(),
  },
];

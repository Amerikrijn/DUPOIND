import type { QuizQuestion } from './types';

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  { question: "Waarom heeft Utrecht meer fietsen dan inwoners?", options: ["Iedereen heeft 2 fietsen", "Veel toeristen laten hun fiets achter", "Er zijn parkeergarages speciaal voor fietsen", "Alle antwoorden zijn correct"], correct: 3, city: "Utrecht", cityId: "utrecht", explanation: "Utrecht heeft de grootste fietsenstalling ter wereld bij het centraal station!", author: "DUPOIND Cultural Team" },
  { question: "Hoe oud is Lissabon vergeleken met Rome?", options: ["400 jaar jonger", "Precies even oud", "400 jaar ouder", "Lissabon is gesticht in 1900"], correct: 2, city: "Lisbon", cityId: "lisbon", explanation: "Lissabon is een van de oudste steden ter wereld, zelfs 400 jaar ouder dan Rome!", author: "DUPOIND Cultural Team" },
  { question: "Wat is de bijnaam van Chennai in de auto-industrie?", options: ["Silicon Valley of India", "Detroit of South Asia", "The Great Engine", "Auto City"], correct: 1, city: "Chennai", cityId: "chennai", explanation: "Chennai produceert het grootste deel van de Indiase auto-onderdelen.", author: "DUPOIND Cultural Team" },
  { question: "Wat is een typisch Utrechts koekje van de banketbakker?", options: ["Stroopwafel", "Domtorentje", "Sprits", "Speculaas"], correct: 1, city: "Utrecht", cityId: "utrecht", explanation: "De Domtorentjes zijn een echte Utrechtse chocolade-specialiteit.", author: "DUPOIND Cultural Team" },
  { question: "Welke rivier stroomt door Lissabon?", options: ["Douro", "Tejo (Tagus)", "Sado", "Mondego"], correct: 1, city: "Lisbon", cityId: "lisbon", explanation: "De Tejo is de grootste rivier van het Iberisch schiereiland.", author: "DUPOIND Cultural Team" },
  { question: "Welk wereldberoemde strand ligt in Chennai?", options: ["Goa Beach", "Marina Beach", "Juhu Beach", "Kovalam Beach"], correct: 1, city: "Chennai", cityId: "chennai", explanation: "Marina Beach is een van de langste stadsstranden ter wereld.", author: "DUPOIND Cultural Team" },
  { question: "Op hoeveel heuvels is Lissabon gebouwd?", options: ["3", "5", "7", "12"], correct: 2, city: "Lisbon", cityId: "lisbon", explanation: "Lissabon staat bekend als 'het Lissabon van de 7 heuvels'.", author: "DUPOIND Cultural Team" },
  { question: "Welke klassieke dansvorm is iconisch voor Chennai?", options: ["Kathak", "Bharatanatyam", "Odissi", "Bhangra"], correct: 1, city: "Chennai", cityId: "chennai", explanation: "Bharatanatyam is een eeuwenoude dansvorm uit Tamil Nadu.", author: "DUPOIND Cultural Team" },
  { question: "Wat is de hoogste kerktoren van Nederland?", options: ["Martinitoren", "Domtoren", "Nieuwe Kerk Delft", "Sint Jan"], correct: 1, city: "Utrecht", cityId: "utrecht", explanation: "Met 112 meter is de Dom de hoogste en trots van Utrecht.", author: "DUPOIND Cultural Team" },
  { question: "Wat is een 'Pastel de Nata'?", options: ["Een visgerecht", "Een roomgebakje", "Een soort soep", "Een kledingstuk"], correct: 1, city: "Lisbon", cityId: "lisbon", explanation: "Dit beroemde roomgebakje komt oorspronkelijk uit Belém, Lissabon.", author: "DUPOIND Cultural Team" },
  { question: "Hoe heet het lokale filterkoffie-ritueel in Chennai?", options: ["Expresso", "Chai", "Filter Kaapi", "Matcha"], correct: 2, city: "Chennai", cityId: "chennai", explanation: "Filter Kaapi is een diepgeworteld ochtendritueel in Zuid-India.", author: "DUPOIND Cultural Team" },
  { question: "Wat is 'Gezellig' in het Engels volgens UU?", options: ["Cozy", "Fun", "No direct translation", "Busy"], correct: 2, city: "Utrecht", cityId: "utrecht", explanation: "Gezelligheid is een uniek Nederlands concept dat sfeer en saamhorigheid beschrijft.", author: "DUPOIND Cultural Team" }
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

export const MOODS = ['😄','😊','😐','🫠','🔥','🎉'];

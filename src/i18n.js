export const TOP_COLORS = ['#E74C3C', '#3498DB', '#F39C12', '#9B59B6'];
export const BOTTOM_COLORS = ['#2ECC71', '#E67E22', '#16A085', '#C0392B', '#8E44AD'];

// Bücherrätsel-Wörter: oben 4, unten 5 Buchstaben
export const BOOK_WORDS = {
  de: { top: 'MOND', bottom: 'SONNE' },
  en: { top: 'MOON', bottom: 'SUNNY' },
};

export const translations = {
  de: {
    subtitle: 'Ein Point-and-Click-Rechenspiel',
    intro: 'Du und deine Katze wollt raus – aber wie? Die Tür lässt sich im Moment einfach nicht öffnen...',
    start: 'Spiel starten',
    musicHint: 'Tippe oder klicke irgendwo, um die Musik zu starten',
    winTitle: 'Geschafft!',
    winText: 'Du hast alle Rätsel gelöst und bist entkommen!',
    timeRemaining: 'Verbleibende Zeit:',
    playAgain: 'Nochmal spielen',
    loseTitle: 'Zeit abgelaufen!',
    loseText: (done, total) => `Du hast ${done} von ${total} Stationen gelöst.`,
    tryAgain: 'Nochmal versuchen',
    restart: 'Neu beginnen',
    progress: 'Fortschritt:',
    correct: 'Richtig! Station gelöst!',
    wrong: 'Leider falsch. Versuche es nochmal!',
    check: 'Antwort prüfen',
    stations: {
      1: { name: 'Tresor', problem: 'Vereinfache die Wurzel: √72 = ?√2', placeholder: 'Nur die Zahl vor √2' },
      2: { name: 'Tafel', problem: 'Löse die Gleichung: √(x+5) = 7', placeholder: 'Nur die Zahl' },
      3: { name: 'Regal', problem: 'Berechne: 3√2 + 5√2 - 2√2 = ?√2', placeholder: 'Nur die Zahl vor √2' },
      4: { name: 'Fenster', problem: 'Multipliziere: √3 · √12', placeholder: 'Nur die Zahl' },
      5: { name: 'Tür', problem: 'Rationalisiere den Nenner: 6/√3' },
      6: { name: 'Pflanze', problem: 'Vereinfache: √50 - √18 = ?√2', placeholder: 'Nur die Zahl vor √2' },
    },
  },
  en: {
    subtitle: 'A point-and-click math game',
    intro: "You and your cat want to get out – but how? The door just won't open right now...",
    start: 'Start game',
    musicHint: 'Tap or click anywhere to start the music',
    winTitle: 'You made it!',
    winText: 'You solved all the puzzles and escaped!',
    timeRemaining: 'Time remaining:',
    playAgain: 'Play again',
    loseTitle: "Time's up!",
    loseText: (done, total) => `You solved ${done} of ${total} stations.`,
    tryAgain: 'Try again',
    restart: 'Restart',
    progress: 'Progress:',
    correct: 'Correct! Station solved!',
    wrong: 'Wrong, unfortunately. Try again!',
    check: 'Check answer',
    stations: {
      1: { name: 'Safe', problem: 'Simplify the root: √72 = ?√2', placeholder: 'Just the number before √2' },
      2: { name: 'Blackboard', problem: 'Solve the equation: √(x+5) = 7', placeholder: 'Just the number' },
      3: { name: 'Shelf', problem: 'Calculate: 3√2 + 5√2 - 2√2 = ?√2', placeholder: 'Just the number before √2' },
      4: { name: 'Window', problem: 'Multiply: √3 · √12', placeholder: 'Just the number' },
      5: { name: 'Door', problem: 'Rationalize the denominator: 6/√3' },
      6: { name: 'Plant', problem: 'Simplify: √50 - √18 = ?√2', placeholder: 'Just the number before √2' },
    },
  },
};

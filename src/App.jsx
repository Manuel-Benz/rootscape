import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CheckCircle, XCircle, Clock, Trophy, Volume2, VolumeX } from 'lucide-react';
import { translations, BOOK_WORDS, TOP_COLORS, BOTTOM_COLORS } from './i18n.js';
import { playSound as playSoundRaw, startIntroMusic, resumeAudio, onAudioRunning } from './audio.js';
import { Sun, Cat, FishFood, Bowl, Mug, Jug } from './components.jsx';

const GAME_SECONDS = 10 * 60;
const SKY = '#EAF6FF';

// Layout-Konstanten, die Render- UND Treffer-/Drop-Logik gemeinsam nutzen
const BOOK_LAYOUT = {
	startX: { top: 698, bottom: 682 }, // Reihen mittig im Regal-Innenraum (680–840)
	y: { top: 350, bottom: 430 },
	stride: 32,
	width: 28,
	height: 65,
};
const WINDOW_RECT = { x: 230, y: 80, w: 150, h: 200 }; // Station 4, zugleich Drop-Ziel der Sonne
const BOWL_POS = { x: 70, y: 653 };
const BOWL_DROP = { x: BOWL_POS.x - 25, y: BOWL_POS.y - 13, w: 50, h: 30 };

// Tafeltexte (mathematisch, daher sprachneutral)
const BLACKBOARD_TEXT = { teaser: '√x² = |x|', task: '√(x+5) = 7' };

// Stations-Logik (Texte kommen aus i18n)
const STATIONS = [
	{ id: 6, answer: '2', inputType: 'text' },
	{ id: 3, answer: '6', inputType: 'text', requiresCompleted: [6], requiresBooks: true },
	{ id: 4, answer: '6', inputType: 'text', requiresSun: true },
	{ id: 2, answer: '44', inputType: 'text', requiresCompleted: [4] },
	{ id: 1, answer: '6', inputType: 'text', requiresCompleted: [2] },
	{ id: 5, answer: '2√3', inputType: 'multiple', options: ['2√3', '6√3', '√3', '3√2'], requiresCatFed: true },
];

const inRect = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

const shuffleArray = (array) => {
	const newArray = [...array];
	for (let i = newArray.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[newArray[i], newArray[j]] = [newArray[j], newArray[i]];
	}
	return newArray;
};

const makeBooks = (word, colors) => word.split('').map((letter, i) => ({ letter, color: colors[i] }));

// Mischen, aber nie direkt in der Lösung starten
const shuffledBooks = (word, colors) => {
	let books = shuffleArray(makeBooks(word, colors));
	while (books.map((b) => b.letter).join('') === word) {
		books = shuffleArray(books);
	}
	return books;
};

const getInitialBooks = (lang) => ({
	top: shuffledBooks(BOOK_WORDS[lang].top, TOP_COLORS),
	bottom: shuffledBooks(BOOK_WORDS[lang].bottom, BOTTOM_COLORS),
});

// Client-Koordinaten (Maus oder Touch) in SVG-Koordinaten umrechnen
const svgPoint = (svg, e) => {
	const pt = svg.createSVGPoint();
	const touch = e.touches?.[0] ?? e.changedTouches?.[0] ?? e;
	pt.x = touch.clientX;
	pt.y = touch.clientY;
	return pt.matrixTransform(svg.getScreenCTM().inverse());
};

const formatTime = (seconds) => {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const Book = ({ x, y, color, letter, opacity = 1 }) => (
	<g opacity={opacity}>
		<rect x={x} y={y} width={BOOK_LAYOUT.width} height={BOOK_LAYOUT.height} rx="2" fill={color} />
		<text
			x={x + BOOK_LAYOUT.width / 2}
			y={y + 35}
			textAnchor="middle"
			fill="white"
			fontSize="24"
			fontWeight="bold"
			fontFamily="Arial"
		>
			{letter}
		</text>
	</g>
);

const LangSoundControls = ({ language, setLanguage, soundOn, setSoundOn }) => (
	<div className="flex items-stretch gap-2">
		<div className="flex rounded-lg overflow-hidden border border-purple-300">
			{['de', 'en'].map((l) => (
				<button
					key={l}
					onClick={() => setLanguage(l)}
					className={`px-3 py-1 text-sm font-bold transition-colors ${
						language === l ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-100'
					}`}
				>
					{l.toUpperCase()}
				</button>
			))}
		</div>
		<button
			onClick={() => setSoundOn((s) => !s)}
			className={`px-1.5 flex items-center rounded-lg border transition-colors ${
				soundOn
					? 'border-purple-300 bg-purple-600 text-white'
					: 'border-purple-300 bg-white text-purple-400 hover:bg-purple-100'
			}`}
			title={soundOn ? 'Sound aus / off' : 'Sound an / on'}
		>
			{soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
		</button>
	</div>
);

// Vollbild-Karte für Start-, Gewonnen- und Verloren-Bildschirm
const FullscreenCard = ({ gradient, controls, children }) => (
	<div className={`min-h-screen bg-gradient-to-br ${gradient} flex items-center justify-center p-4`}>
		<div className="fixed top-4 right-4">{controls}</div>
		<div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl text-center">{children}</div>
	</div>
);

const EscaperoomGame = () => {
	const [language, setLanguage] = useState('de');
	const [soundOn, setSoundOn] = useState(true);
	const [audioReady, setAudioReady] = useState(false);

	const [gameStarted, setGameStarted] = useState(false);
	const [currentStation, setCurrentStation] = useState(null);
	const [completedStations, setCompletedStations] = useState([]);
	const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
	const [gameWon, setGameWon] = useState(false);
	const [userAnswer, setUserAnswer] = useState('');
	const [feedback, setFeedback] = useState(null); // 'success' | 'error' | null
	const [sunInWindow, setSunInWindow] = useState(false);
	const [catFed, setCatFed] = useState(false);
	const [topBooks, setTopBooks] = useState(() => shuffledBooks(BOOK_WORDS.de.top, TOP_COLORS));
	const [bottomBooks, setBottomBooks] = useState(() => shuffledBooks(BOOK_WORDS.de.bottom, BOTTOM_COLORS));

	// Ein Drag-Modell für Sonne, Futter und Bücher: Was gezogen wird (ändert sich
	// nur bei Start/Ende) getrennt von der Position (ändert sich bei jedem Move).
	const [dragItem, setDragItem] = useState(null); // { kind: 'sun'|'food'|'book', row?, fromIndex?, letter?, color? }
	const [dragPos, setDragPos] = useState({ x: 0, y: 0 });

	const t = translations[language];
	const words = BOOK_WORDS[language];

	// Abgeleitet statt eigener State: Bücherrätsel gelöst?
	const booksCorrect =
		topBooks.map((b) => b.letter).join('') === words.top &&
		bottomBooks.map((b) => b.letter).join('') === words.bottom;
	const booksDraggable = completedStations.includes(6) && !booksCorrect;

	// Soundeffekte, per Ref an den Schalter gekoppelt (stabile Funktion)
	const soundOnRef = useRef(soundOn);
	useEffect(() => {
		soundOnRef.current = soundOn;
	}, [soundOn]);
	const sfx = useCallback((type) => {
		if (soundOnRef.current) playSoundRaw(type);
	}, []);

	// Erfolgs-Klang genau beim Übergang ungelöst → gelöst
	const wasSolvedRef = useRef(booksCorrect);
	useEffect(() => {
		if (booksCorrect && !wasSolvedRef.current) sfx('booksSolved');
		wasSolvedRef.current = booksCorrect;
	}, [booksCorrect, sfx]);

	// Audio starten: sofort beim Laden versuchen (Chrome erlaubt das bei bereits
	// bekannten Seiten), sonst bei der ersten Nutzer-Interaktion. audioReady wird
	// erst gesetzt, wenn der AudioContext wirklich läuft — nicht schon beim Versuch.
	useEffect(() => {
		if (audioReady) return;
		const markReady = () => setAudioReady(true);
		const tryStart = () => {
			if (resumeAudio()) markReady();
		};
		const unsubscribe = onAudioRunning(markReady);
		tryStart();
		const events = ['pointerdown', 'keydown', 'click', 'touchend'];
		events.forEach((ev) => window.addEventListener(ev, tryStart));
		return () => {
			unsubscribe();
			events.forEach((ev) => window.removeEventListener(ev, tryStart));
		};
	}, [audioReady]);

	// Intro-Musik auf dem Startbildschirm
	useEffect(() => {
		if (!audioReady || gameStarted || !soundOn) return;
		const stop = startIntroMusic();
		return stop;
	}, [audioReady, gameStarted, soundOn]);

	// Sprachwechsel: gelöstes Rätsel bleibt gelöst (Wörter der neuen Sprache),
	// ungelöstes wird mit den neuen Buchstaben neu gemischt
	useEffect(() => {
		if (booksCorrect) {
			setTopBooks(makeBooks(words.top, TOP_COLORS));
			setBottomBooks(makeBooks(words.bottom, BOTTOM_COLORS));
		} else {
			const books = getInitialBooks(language);
			setTopBooks(books.top);
			setBottomBooks(books.bottom);
		}
		setDragItem(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [language]);

	// Countdown
	useEffect(() => {
		if (!gameStarted || gameWon) return;
		const timer = setInterval(() => {
			setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
		}, 1000);
		return () => clearInterval(timer);
	}, [gameStarted, gameWon]);

	const resetGame = useCallback(() => {
		const books = getInitialBooks(language);
		setGameStarted(false);
		setCurrentStation(null);
		setCompletedStations([]);
		setTimeLeft(GAME_SECONDS);
		setGameWon(false);
		setUserAnswer('');
		setFeedback(null);
		setSunInWindow(false);
		setCatFed(false);
		setTopBooks(books.top);
		setBottomBooks(books.bottom);
		setDragItem(null);
	}, [language]);

	const handleSubmit = (answer = userAnswer) => {
		const station = STATIONS.find((s) => s.id === currentStation);
		if (!station) return;
		const normalizedAnswer = answer.replace(/\s/g, '').toLowerCase();
		const normalizedCorrect = station.answer.replace(/\s/g, '').toLowerCase();

		if (normalizedAnswer === normalizedCorrect) {
			sfx('correct');
			setFeedback('success');
			setCompletedStations((prev) => (prev.includes(station.id) ? prev : [...prev, station.id]));
			setTimeout(() => {
				setCurrentStation(null);
				setUserAnswer('');
				setFeedback(null);
			}, 1500);
		} else {
			sfx('wrong');
			setFeedback('error');
		}
	};

	const canOpenStation = useCallback(
		(stationId) => {
			const station = STATIONS.find((s) => s.id === stationId);
			if (!station) return false;
			if (completedStations.includes(stationId)) return false;
			if (station.requiresBooks && !booksCorrect) return false;
			if (station.requiresCompleted && !station.requiresCompleted.every((id) => completedStations.includes(id))) return false;
			if (station.requiresSun && !sunInWindow) return false;
			if (station.requiresCatFed && !catFed) return false;
			return true;
		},
		[completedStations, booksCorrect, sunInWindow, catFed],
	);

	const openStation = useCallback(
		(stationId) => {
			if (canOpenStation(stationId)) {
				setCurrentStation(stationId);
				setUserAnswer('');
				setFeedback(null);
			}
		},
		[canOpenStation],
	);

	const startDrag = useCallback((kind, extra = {}) => (e) => {
		if (e.cancelable) e.preventDefault();
		e.stopPropagation();
		setDragItem({ kind, ...extra });
		setDragPos(svgPoint(e.currentTarget.ownerSVGElement, e));
	}, []);

	const startBookDrag = useCallback(
		(row, fromIndex, book) => (e) => {
			if (!booksDraggable) return;
			startDrag('book', { row, fromIndex, letter: book.letter, color: book.color })(e);
		},
		[booksDraggable, startDrag],
	);

	const handlePointerMove = (e) => {
		if (!dragItem) return;
		if (e.cancelable) e.preventDefault();
		setDragPos(svgPoint(e.currentTarget, e));
	};

	// Nach einem Drag kann der Browser noch ein Click-Event auf dem Element
	// unter dem Mauszeiger auslösen — das würde z.B. beim Andocken des letzten
	// Buchs sofort das Regal-Modal öffnen. Clicks kurz nach Drag-Ende schlucken.
	const dragEndAtRef = useRef(0);

	const swallowClickAfterDrag = (e) => {
		if (performance.now() - dragEndAtRef.current < 150) {
			e.stopPropagation();
		}
	};

	const handlePointerUp = (e) => {
		if (!dragItem) return;
		if (e.cancelable) e.preventDefault();
		const p = svgPoint(e.currentTarget, e);
		setDragItem(null);
		dragEndAtRef.current = performance.now();

		if (dragItem.kind === 'sun') {
			if (inRect(p, WINDOW_RECT)) {
				setSunInWindow(true);
				sfx('sun');
			}
		} else if (dragItem.kind === 'food') {
			if (inRect(p, BOWL_DROP)) {
				setCatFed(true);
				sfx('cat');
			}
		} else if (dragItem.kind === 'book') {
			const { row, fromIndex } = dragItem;
			let targetIndex = -1;
			for (let idx = 0; idx < words[row].length; idx++) {
				const bookX = BOOK_LAYOUT.startX[row] + idx * BOOK_LAYOUT.stride;
				if (p.x >= bookX && p.x <= bookX + BOOK_LAYOUT.width) {
					targetIndex = idx;
					break;
				}
			}
			if (targetIndex !== -1 && targetIndex !== fromIndex) {
				sfx('click');
				const setBooks = row === 'top' ? setTopBooks : setBottomBooks;
				setBooks((prev) => {
					const next = [...prev];
					const [moved] = next.splice(fromIndex, 1);
					next.splice(targetIndex, 0, moved);
					return next;
				});
			}
		}
	};

	const doorOpen = completedStations.includes(5);

	// Statische Raum-Szene, memoisiert: bei Drag-Bewegungen (dragPos) muss nur die
	// kleine Vorschau-Ebene neu rendern, nicht die komplette SVG-Szene.
	const scene = useMemo(
		() => (
			<>
				{/* Raum */}
				<rect x="0" y="550" width="900" height="150" fill="#FF9680" />
				<rect x="0" y="0" width="900" height="550" fill="#FFF1A1" />
				<rect x="0" y="530" width="900" height="20" fill="#8B7355" />

				{/* Fenster links (Deko) */}
				<g>
					<rect x="50" y="80" width="150" height="200" rx="4" fill="#FFFFFF" />
					<rect x="58" y="88" width="63" height="88" fill="#A8DAFF" />
					<rect x="129" y="88" width="63" height="88" fill="#A8DAFF" />
					<rect x="58" y="184" width="63" height="88" fill="#A8DAFF" />
					<rect x="129" y="184" width="63" height="88" fill="#A8DAFF" />
				</g>

				{/* Fenster rechts (Station 4) */}
				<g>
					<rect x={WINDOW_RECT.x} y={WINDOW_RECT.y} width={WINDOW_RECT.w} height={WINDOW_RECT.h} rx="4" fill="#FFFFFF" />
					<rect x="238" y="88" width="63" height="88" fill="#A8DAFF" />
					<rect x="309" y="88" width="63" height="88" fill="#A8DAFF" />
					<rect x="238" y="184" width="63" height="88" fill="#A8DAFF" />
					<rect x="309" y="184" width="63" height="88" fill="#A8DAFF" />
					{sunInWindow && <Sun x={330} y={150} r={18} />}
					{/* Fensterkreuz über der Sonne (Sonne ist „hinter der Scheibe") */}
					<rect x="301" y="88" width="8" height="184" fill="#FFFFFF" />
					<rect x="238" y="176" width="134" height="8" fill="#FFFFFF" />
				</g>
				<g
					onClick={() => openStation(4)}
					style={{
						cursor: canOpenStation(4) ? 'pointer' : 'default',
						pointerEvents: canOpenStation(4) || completedStations.includes(4) ? 'auto' : 'none',
					}}
				>
					<rect x={WINDOW_RECT.x} y={WINDOW_RECT.y} width={WINDOW_RECT.w} height={WINDOW_RECT.h} fill="transparent" />
				</g>

				{/* Tür (Station 5) bzw. offener Ausgang */}
				{!doorOpen ? (
					<g onClick={() => openStation(5)} style={{ cursor: canOpenStation(5) ? 'pointer' : 'default' }}>
						<rect x="410" y="150" width="200" height="400" rx="6" fill="#AA96DA" />
						<rect x="425" y="170" width="170" height="150" rx="6" fill="#9B86C4" />
						<rect x="425" y="360" width="170" height="170" rx="6" fill="#9B86C4" />
						<circle cx="578" cy="340" r="9" fill="#FFD700" />
						<circle cx="576" cy="338" r="3.5" fill="#FFE566" />
					</g>
				) : (
					<g onClick={() => { sfx('win'); setGameWon(true); }} style={{ cursor: 'pointer' }}>
						{/* Türrahmen */}
						<rect x="402" y="142" width="216" height="416" rx="6" fill="#8A76B8" />
						{/* Himmel + Wiese */}
						<rect x="410" y="150" width="200" height="230" fill="#87CEEB" />
						<rect x="410" y="380" width="200" height="170" fill="#7CFC00" />

						{/* Wolken */}
						<g>
							<ellipse cx="460" cy="200" rx="25" ry="15" fill="#FFFFFF" opacity="0.9" />
							<ellipse cx="480" cy="195" rx="30" ry="18" fill="#FFFFFF" opacity="0.9" />
							<ellipse cx="500" cy="200" rx="25" ry="15" fill="#FFFFFF" opacity="0.9" />
							<ellipse cx="470" cy="208" rx="28" ry="16" fill="#FFFFFF" opacity="0.9" />
							<ellipse cx="490" cy="210" rx="26" ry="14" fill="#FFFFFF" opacity="0.9" />
							<ellipse cx="540" cy="250" rx="20" ry="12" fill="#FFFFFF" opacity="0.85" />
							<ellipse cx="555" cy="247" rx="25" ry="14" fill="#FFFFFF" opacity="0.85" />
							<ellipse cx="570" cy="250" rx="22" ry="13" fill="#FFFFFF" opacity="0.85" />
							<ellipse cx="555" cy="257" rx="24" ry="12" fill="#FFFFFF" opacity="0.85" />
						</g>

						{/* Büsche */}
						<g>
							<ellipse cx="450" cy="390" rx="20" ry="16" fill="#2E7D32" />
							<ellipse cx="442" cy="388" rx="13" ry="12" fill="#388E3C" />
							<ellipse cx="458" cy="386" rx="15" ry="13" fill="#43A047" />
							<ellipse cx="580" cy="392" rx="17" ry="14" fill="#2E7D32" />
							<ellipse cx="574" cy="390" rx="11" ry="10" fill="#388E3C" />
							<ellipse cx="586" cy="389" rx="12" ry="11" fill="#43A047" />
						</g>

						{/* Grashalme */}
						<g stroke="#228B22" strokeWidth="2">
							<line x1="420" y1="540" x2="422" y2="510" />
							<line x1="432" y1="542" x2="434" y2="515" />
							<line x1="445" y1="538" x2="447" y2="512" />
							<line x1="470" y1="470" x2="472" y2="448" />
							<line x1="490" y1="445" x2="492" y2="424" />
							<line x1="510" y1="480" x2="512" y2="458" />
							<line x1="530" y1="440" x2="532" y2="420" />
							<line x1="555" y1="470" x2="557" y2="450" />
							<line x1="575" y1="540" x2="577" y2="515" />
							<line x1="590" y1="500" x2="592" y2="478" />
							<line x1="470" y1="415" x2="472" y2="398" />
							<line x1="545" y1="415" x2="547" y2="398" />
						</g>

						{/* Katze wartet im Ausgang */}
						<Cat x={520} y={460} scale={0.8} />
					</g>
				)}

				{/* Bild an der Wand (Mond / Sonne) */}
				<g>
					<rect x="702" y="112" width="156" height="196" rx="4" fill="#C9A96A" />
					<rect x="712" y="122" width="136" height="176" fill={SKY} />
					<rect x="712" y="270" width="136" height="28" fill="#8FE07C" />
					<polygon points="725,270 750,220 775,270" fill="#8B7355" />
					<polygon points="770,270 795,210 820,270" fill="#6B5345" />
					<polygon points="735,268 745,250 755,268" fill="#228B22" />
					<polygon points="785,268 795,245 805,268" fill="#228B22" />

					{!completedStations.includes(3) && (
						<g>
							{/* Mondsichel */}
							<circle cx="800" cy="175" r="18" fill="#C0C0C0" />
							<circle cx="794" cy="169" r="16" fill={SKY} />
						</g>
					)}

					{completedStations.includes(3) && !sunInWindow && dragItem?.kind !== 'sun' && (
						<g style={{ cursor: 'grab' }} onMouseDown={startDrag('sun')} onTouchStart={startDrag('sun')}>
							<Sun x={800} y={175} r={12} />
						</g>
					)}
				</g>

				{/* Tafel (Station 2) */}
				<g onClick={() => openStation(2)} style={{ cursor: canOpenStation(2) ? 'pointer' : 'default' }}>
					<rect x="44" y="324" width="312" height="192" rx="6" fill="#8B7355" />
					<rect x="56" y="336" width="288" height="168" fill="#3E4A47" />
					<rect x="56" y="500" width="288" height="6" fill="#6E5A43" />
					<text x="200" y="430" textAnchor="middle" fill="#F5F5F0" fontSize="32" fontFamily="Arial">
						{completedStations.includes(4) ? BLACKBOARD_TEXT.task : BLACKBOARD_TEXT.teaser}
					</text>
				</g>

				{/* Tresor (Station 1), erscheint nach Tafel */}
				{completedStations.includes(2) && (
					<g onClick={() => openStation(1)} style={{ cursor: canOpenStation(1) ? 'pointer' : 'default' }}>
						<rect x="125" y="360" width="100" height="120" rx="6" fill="#4A4A4A" />
						{!completedStations.includes(1) ? (
							<>
								<rect x="134" y="369" width="82" height="102" rx="4" fill="#5C5C5C" />
								<circle cx="175" cy="410" r="15" fill="#FFD700" />
								<circle cx="175" cy="410" r="6" fill="#333333" />
								<line x1="175" y1="410" x2="175" y2="399" stroke="#333333" strokeWidth="3" strokeLinecap="round" />
								<rect x="185" y="445" width="22" height="7" rx="3" fill="#C0C0C0" />
							</>
						) : (
							<>
								<rect x="175" y="369" width="41" height="102" fill="#2A2A2A" />
								<rect x="125" y="369" width="50" height="102" rx="4" fill="#5C5C5C" />
								{!catFed && dragItem?.kind !== 'food' && (
									<g style={{ cursor: 'grab' }} onMouseDown={startDrag('food')} onTouchStart={startDrag('food')}>
										<FishFood x={196} y={415} />
									</g>
								)}
							</>
						)}
					</g>
				)}

				{/* Regal mit Büchern (Station 3) */}
				<g onClick={() => openStation(3)} style={{ cursor: canOpenStation(3) ? 'pointer' : 'default' }}>
					<rect x="670" y="330" width="180" height="220" fill="#B8E3DA" />
					<rect x="670" y="330" width="10" height="220" fill="#6FB2A4" />
					<rect x="840" y="330" width="10" height="220" fill="#6FB2A4" />
					<rect x="670" y="330" width="180" height="14" fill="#6FB2A4" />
					<rect x="670" y="416" width="180" height="12" fill="#6FB2A4" />
					<rect x="670" y="496" width="180" height="12" fill="#6FB2A4" />
					<rect x="670" y="538" width="180" height="12" fill="#6FB2A4" />

					{[
						{ row: 'top', books: topBooks },
						{ row: 'bottom', books: bottomBooks },
					].map(({ row, books }) =>
						books.map((book, i) => {
							const hidden = dragItem?.kind === 'book' && dragItem.row === row && dragItem.fromIndex === i;
							return (
								<g
									key={`${row}-${i}`}
									style={{ cursor: booksDraggable ? 'grab' : 'default' }}
									onMouseDown={startBookDrag(row, i, book)}
									onTouchStart={startBookDrag(row, i, book)}
								>
									<Book
										x={BOOK_LAYOUT.startX[row] + i * BOOK_LAYOUT.stride}
										y={BOOK_LAYOUT.y[row]}
										color={book.color}
										letter={book.letter}
										opacity={hidden ? 0.3 : 1}
									/>
								</g>
							);
						}),
					)}
				</g>

				{/* Tisch */}
				<g>
					<rect x="200" y="610" width="400" height="20" rx="3" fill="#9C7E5B" />
					<rect x="200" y="610" width="400" height="5" rx="2" fill="#B08F68" />
					<rect x="200" y="626" width="400" height="4" fill="#6E5A43" />
					<rect x="220" y="630" width="20" height="100" rx="2" fill="#5E4630" />
					<rect x="360" y="630" width="20" height="100" rx="2" fill="#5E4630" />
					<rect x="500" y="630" width="20" height="100" rx="2" fill="#5E4630" />
					<rect x="560" y="630" width="20" height="100" rx="2" fill="#5E4630" />
				</g>

				{/* Becher + Krug auf dem Tisch */}
				<Mug x={350} y={611} />
				<Jug x={420} y={611} />

				{/* Pflanze (Station 6) */}
				<g onClick={() => openStation(6)} style={{ cursor: canOpenStation(6) ? 'pointer' : 'default' }}>
					<ellipse cx="800" cy="642" rx="35" ry="9" fill="#A0522D" />
					<rect x="765" y="600" width="70" height="42" fill="#A0522D" />
					<ellipse cx="800" cy="600" rx="35" ry="9" fill="#8B4513" />
					<ellipse cx="800" cy="601" rx="30" ry="6" fill="#654321" />
					<rect x="798" y="520" width="4" height="80" fill="#A0522D" />

					{!completedStations.includes(6) ? (
						<g>
							<ellipse cx="760" cy="570" rx="45" ry="60" fill="#2D7D3F" transform="rotate(-25 760 570)" />
							<ellipse cx="750" cy="540" rx="40" ry="55" fill="#3A9B4F" transform="rotate(-30 750 540)" />
							<ellipse cx="745" cy="505" rx="38" ry="50" fill="#4CAF50" transform="rotate(-20 745 505)" />
							<ellipse cx="840" cy="565" rx="45" ry="60" fill="#2D7D3F" transform="rotate(25 840 565)" />
							<ellipse cx="850" cy="535" rx="42" ry="58" fill="#3A9B4F" transform="rotate(30 850 535)" />
							<ellipse cx="855" cy="500" rx="40" ry="52" fill="#4CAF50" transform="rotate(20 855 500)" />
							<ellipse cx="800" cy="480" rx="48" ry="55" fill="#4CAF50" />
							<ellipse cx="790" cy="450" rx="42" ry="50" fill="#66BB6A" transform="rotate(-10 790 450)" />
							<ellipse cx="810" cy="445" rx="40" ry="48" fill="#81C784" transform="rotate(10 810 445)" />
							<ellipse cx="770" cy="520" rx="30" ry="40" fill="#66BB6A" transform="rotate(-15 770 520)" />
							<ellipse cx="830" cy="515" rx="32" ry="42" fill="#66BB6A" transform="rotate(15 830 515)" />
						</g>
					) : (
						<g>
							<ellipse cx="795" cy="560" rx="15" ry="20" fill="#556B2F" transform="rotate(-10 795 560)" />
							<ellipse cx="805" cy="555" rx="12" ry="18" fill="#6B8E23" transform="rotate(10 805 555)" />
						</g>
					)}
				</g>

				{/* Futternapf */}
				<Bowl x={BOWL_POS.x} y={BOWL_POS.y} eaten={catFed} />

				{/* Katze: erst am Napf, nach dem Füttern wartend an der Tür */}
				{!doorOpen && (catFed ? <Cat x={530} y={490} /> : <Cat x={125} y={582} />)}
			</>
		),
		[completedStations, booksCorrect, booksDraggable, sunInWindow, catFed, doorOpen, dragItem, topBooks, bottomBooks, canOpenStation, openStation, startDrag, startBookDrag, sfx],
	);

	const controls = (
		<LangSoundControls language={language} setLanguage={setLanguage} soundOn={soundOn} setSoundOn={setSoundOn} />
	);

	if (!gameStarted) {
		return (
			<FullscreenCard gradient="from-purple-100 to-blue-100" controls={controls}>
				<h1 className="text-5xl font-bold text-purple-600 mb-6">Rootscape</h1>
				<p className="text-2xl text-gray-500 mb-4">{t.subtitle}</p>
				<p className="text-lg text-gray-700 mb-8">{t.intro}</p>
				<button
					onClick={() => setGameStarted(true)}
					className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xl py-4 px-12 rounded-full transition-all transform hover:scale-105"
				>
					{t.start}
				</button>
				{soundOn && !audioReady && <p className="text-sm text-gray-400 mt-6">{t.musicHint}</p>}
			</FullscreenCard>
		);
	}

	if (gameWon) {
		return (
			<FullscreenCard gradient="from-green-100 to-emerald-100" controls={controls}>
				<Trophy className="w-32 h-32 mx-auto text-yellow-500 mb-6" />
				<h1 className="text-5xl font-bold text-green-600 mb-6">{t.winTitle}</h1>
				<p className="text-2xl text-gray-700 mb-4">{t.winText}</p>
				<p className="text-xl text-gray-600 mb-8">
					{t.timeRemaining} {formatTime(timeLeft)}
				</p>
				<button
					onClick={resetGame}
					className="bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-4 px-12 rounded-full transition-all"
				>
					{t.playAgain}
				</button>
			</FullscreenCard>
		);
	}

	if (timeLeft === 0) {
		return (
			<FullscreenCard gradient="from-red-100 to-orange-100" controls={controls}>
				<XCircle className="w-32 h-32 mx-auto text-red-500 mb-6" />
				<h1 className="text-5xl font-bold text-red-600 mb-6">{t.loseTitle}</h1>
				<p className="text-xl text-gray-700 mb-8">{t.loseText(completedStations.length, STATIONS.length)}</p>
				<button
					onClick={resetGame}
					className="bg-red-600 hover:bg-red-700 text-white font-bold text-xl py-4 px-12 rounded-full transition-all"
				>
					{t.tryAgain}
				</button>
			</FullscreenCard>
		);
	}

	const currentStationData = STATIONS.find((s) => s.id === currentStation);

	return (
		<div className="bg-gradient-to-br from-blue-100 to-purple-100 p-4 min-h-screen flex flex-col items-center justify-start overflow-auto">
			<div className="w-full max-w-6xl mb-4 bg-white rounded-2xl shadow-lg p-4 flex flex-wrap gap-3 justify-between items-center">
				<div className="flex items-center gap-3">
					<Clock className="w-6 h-6 text-purple-600" />
					<span className="text-2xl font-bold text-gray-800">{formatTime(timeLeft)}</span>
				</div>
				<button
					onClick={resetGame}
					className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-xl transition-all"
				>
					{t.restart}
				</button>
				<div className="flex items-center gap-2">
					<span className="text-lg font-semibold text-gray-700">{t.progress}</span>
					<span className="text-xl font-bold text-purple-600">
						{completedStations.length}/{STATIONS.length}
					</span>
				</div>
				{controls}
			</div>

			<div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl p-4 md:p-8 flex items-center justify-center">
				<svg
					viewBox="0 0 900 700"
					className="w-full h-auto"
					style={{ maxHeight: 'calc(100vh - 180px)', maxWidth: '100%', touchAction: 'none' }}
					onMouseMove={handlePointerMove}
					onMouseUp={handlePointerUp}
					onMouseLeave={handlePointerUp}
					onTouchMove={handlePointerMove}
					onTouchEnd={handlePointerUp}
					onClickCapture={swallowClickAfterDrag}
				>
					{scene}

					{/* Drag-Vorschauen ganz oben */}
					{dragItem?.kind === 'sun' && (
						<g opacity="0.85" pointerEvents="none">
							<Sun x={dragPos.x} y={dragPos.y} r={12} />
						</g>
					)}
					{dragItem?.kind === 'food' && (
						<g pointerEvents="none">
							<FishFood x={dragPos.x} y={dragPos.y} opacity={0.85} />
						</g>
					)}
					{dragItem?.kind === 'book' && (
						<g pointerEvents="none">
							<Book
								x={dragPos.x - BOOK_LAYOUT.width / 2}
								y={dragPos.y - BOOK_LAYOUT.height / 2}
								color={dragItem.color}
								letter={dragItem.letter}
								opacity={0.85}
							/>
						</g>
					)}
				</svg>
			</div>

			{/* Aufgaben-Dialog */}
			{currentStationData && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-3xl font-bold text-purple-600">{t.stations[currentStationData.id].name}</h2>
							<button
								onClick={() => setCurrentStation(null)}
								className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
							>
								×
							</button>
						</div>

						<div className="bg-purple-50 rounded-2xl p-6 mb-6">
							<p className="text-xl text-gray-800 font-semibold mb-4">{t.stations[currentStationData.id].problem}</p>

							{currentStationData.inputType === 'text' ? (
								<input
									type="text"
									value={userAnswer}
									onChange={(e) => setUserAnswer(e.target.value)}
									onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
									placeholder={t.stations[currentStationData.id].placeholder}
									className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl text-lg focus:outline-none focus:border-purple-500"
									autoFocus
								/>
							) : (
								<div className="grid grid-cols-2 gap-3">
									{currentStationData.options.map((option) => (
										<button
											key={option}
											onClick={() => handleSubmit(option)}
											className="bg-white hover:bg-purple-100 border-2 border-purple-300 hover:border-purple-500 rounded-xl py-3 px-4 text-lg font-semibold transition-all"
										>
											{option}
										</button>
									))}
								</div>
							)}
						</div>

						{feedback && (
							<div
								className={`mb-4 p-4 rounded-xl flex items-center gap-3 ${
									feedback === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
								}`}
							>
								{feedback === 'success' ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
								<span className="font-semibold">{feedback === 'success' ? t.correct : t.wrong}</span>
							</div>
						)}

						{currentStationData.inputType === 'text' && (
							<button
								onClick={() => handleSubmit()}
								className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xl py-3 rounded-xl transition-all"
							>
								{t.check}
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default EscaperoomGame;

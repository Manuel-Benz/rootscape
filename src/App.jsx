import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle, XCircle, Clock, Trophy } from 'lucide-react';

const EscaperoomGame = () => {
	const [gameStarted, setGameStarted] = useState(false);
	const [currentStation, setCurrentStation] = useState(null);
	const [completedStations, setCompletedStations] = useState([]);
	const [timeLeft, setTimeLeft] = useState(10 * 60);
	const [gameWon, setGameWon] = useState(false);
	const [userAnswer, setUserAnswer] = useState('');
	const [feedback, setFeedback] = useState(null);
	const [sunInWindow, setSunInWindow] = useState(false);
	const [draggingSun, setDraggingSun] = useState(false);
	const [sunPosition, setSunPosition] = useState({ x: 0, y: 0 });
	const [catFed, setCatFed] = useState(false);
	const [draggingFood, setDraggingFood] = useState(false);
	const [foodPosition, setFoodPosition] = useState({ x: 0, y: 0 });
	const [booksCorrect, setBooksCorrect] = useState(false);

	const shuffleArray = (array) => {
		const newArray = [...array];
		for (let i = newArray.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[newArray[i], newArray[j]] = [newArray[j], newArray[i]];
		}
		return newArray;
	};

	const getInitialBooks = () => ({
		top: shuffleArray([
			{letter: 'M', color: '#E74C3C'},
			{letter: 'O', color: '#3498DB'},
			{letter: 'N', color: '#F39C12'},
			{letter: 'D', color: '#9B59B6'}
		]),
		bottom: shuffleArray([
			{letter: 'S', color: '#2ECC71'},
			{letter: 'O', color: '#E67E22'},
			{letter: 'N', color: '#16A085'},
			{letter: 'N', color: '#C0392B'},
			{letter: 'E', color: '#8E44AD'}
		])
	});

	const [topBooks, setTopBooks] = useState(() => getInitialBooks().top);
	const [bottomBooks, setBottomBooks] = useState(() => getInitialBooks().bottom);
	const [draggingBook, setDraggingBook] = useState(null);
	const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

	useEffect(() => {
		let stopScheduled = false;

		const playIntroMusic = () => {
			if (gameStarted || stopScheduled) return;

			try {
				const ctx = new (window.AudioContext || window.webkitAudioContext)();
				const master = ctx.createGain();
				master.gain.value = 0.3;
				master.connect(ctx.destination);

				const tempo = 110;
				const beat = 60 / tempo;

				const melody = [440, 523, 587, 659, 587, 523, 440, 392];
				const bass = [110, 110, 98, 98, 82, 82, 98, 110];

				function note(type, freq, time, duration, volume = 0.4) {
					const osc = ctx.createOscillator();
					const gain = ctx.createGain();

					osc.type = type;
					osc.frequency.value = freq;

					osc.connect(gain);
					gain.connect(master);

					gain.gain.setValueAtTime(0, time);
					gain.gain.linearRampToValueAtTime(volume, time + 0.01);
					gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

					osc.start(time);
					osc.stop(time + duration);
				}

				function kick(time) {
					const osc = ctx.createOscillator();
					const gain = ctx.createGain();

					osc.type = "sine";
					osc.frequency.setValueAtTime(160, time);
					osc.frequency.exponentialRampToValueAtTime(50, time + 0.15);

					osc.connect(gain);
					gain.connect(master);

					gain.gain.setValueAtTime(0.8, time);
					gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

					osc.start(time);
					osc.stop(time + 0.15);
				}

				function hihat(time) {
					const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
					const data = buffer.getChannelData(0);
					for (let i = 0; i < data.length; i++) {
						data[i] = Math.random() * 2 - 1;
					}
					const noise = ctx.createBufferSource();
					noise.buffer = buffer;

					const gain = ctx.createGain();
					gain.gain.value = 0.08;

					noise.connect(gain);
					gain.connect(master);
					noise.start(time);
				}

				const startTime = ctx.currentTime + 0.1;

				for (let i = 0; i < 8; i++) {
					const t = startTime + i * beat;
					note("sawtooth", melody[i], t, beat * 0.8, 0.25);
					note("square", bass[i], t, beat, 0.2);
					if (i % 2 === 0) kick(t);
					hihat(t + beat / 2);
				}

				const buildStart = startTime + 8 * beat;
				for (let i = 0; i < 4; i++) {
					const t = buildStart + i * beat;
					note("sawtooth", melody[i], t, beat * 0.8, 0.28);
					note("square", bass[i], t, beat, 0.25);
					kick(t);
					hihat(t + beat / 2);
				}

				const arp = [440, 523, 659, 880, 523, 659, 784, 988];
				const arpStart = buildStart;

				for (let i = 0; i < arp.length; i++) {
					const t = arpStart + i * (beat / 4);
					note("sawtooth", arp[i], t, beat / 4, 0.4);
				}

				const pedalFreqs = [55, 110, 220];
				for (let i = 0; i < 32; i++) {
					const t = arpStart + i * (beat / 4);
					pedalFreqs.forEach((f, idx) => {
						const vol = idx === 0 ? 0.1 : (idx === 1 ? 0.12 : 0.08);
						note("triangle", f, t, beat / 4, vol);
					});
				}

				const fillStart = arpStart + 4 * beat;
				const fillNotes = [880, 784, 659, 523, 659, 523, 440, 880];
				for (let i = 0; i < fillNotes.length; i++) {
					const t = fillStart + i * (beat / 4);
					note("sawtooth", fillNotes[i], t, beat / 4, 0.35);
					if (i % 2 === 0) kick(t);
					hihat(t);
				}

				const finalTime = buildStart + 6 * beat;
				note("sawtooth", 880, finalTime, beat * 2, 0.5);
				kick(finalTime);
				hihat(finalTime + beat / 4);
				hihat(finalTime + beat / 2);

				const loopLength = 16 * beat;
				setTimeout(() => {
					if (!gameStarted && !stopScheduled) {
						playIntroMusic();
					}
				}, loopLength * 1000);
			} catch (error) {
				console.log('Audio not available:', error);
			}
		};

		if (!gameStarted) {
			playIntroMusic();
		} else {
			stopScheduled = true;
		}

		return () => {
			stopScheduled = true;
		};
	}, [gameStarted]);

	const playSound = (type) => {
		try {
			const audioContext = new (window.AudioContext || window.webkitAudioContext)();
			const oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();

			oscillator.connect(gainNode);
			gainNode.connect(audioContext.destination);

			oscillator.type = 'sine';

			switch(type) {
				case 'correct':
					oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
					oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
					oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
					gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
					gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
					oscillator.start(audioContext.currentTime);
					oscillator.stop(audioContext.currentTime + 0.4);
					break;

				case 'wrong':
					oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
					oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.15);
					gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
					gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
					oscillator.start(audioContext.currentTime);
					oscillator.stop(audioContext.currentTime + 0.3);
					break;

				case 'click':
					oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
					gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
					gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
					oscillator.start(audioContext.currentTime);
					oscillator.stop(audioContext.currentTime + 0.08);
					break;

				case 'booksSolved':
					oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
					oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
					oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.15);
					oscillator.frequency.setValueAtTime(1046.50, audioContext.currentTime + 0.25);
					gainNode.gain.setValueAtTime(0.35, audioContext.currentTime);
					gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
					oscillator.start(audioContext.currentTime);
					oscillator.stop(audioContext.currentTime + 0.5);
					break;

				case 'sun':
					oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
					oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.3);
					gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
					gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
					oscillator.start(audioContext.currentTime);
					oscillator.stop(audioContext.currentTime + 0.35);
					break;

				case 'cat':
					oscillator.type = 'sawtooth';
					oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
					oscillator.frequency.linearRampToValueAtTime(400, audioContext.currentTime + 0.1);
					oscillator.frequency.setValueAtTime(500, audioContext.currentTime + 0.15);
					oscillator.frequency.linearRampToValueAtTime(300, audioContext.currentTime + 0.3);
					gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
					gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.32);
					oscillator.start(audioContext.currentTime);
					oscillator.stop(audioContext.currentTime + 0.32);
					break;

				case 'win':
					oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
					oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.15);
					oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.3);
					oscillator.frequency.setValueAtTime(1046.50, audioContext.currentTime + 0.45);
					gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
					gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.7);
					oscillator.start(audioContext.currentTime);
					oscillator.stop(audioContext.currentTime + 0.7);
					break;
				default:
					break;
			}
		} catch (error) {
			// Silent fail
		}
	};

	const stations = [
		{
			id: 6,
			name: 'Pflanze',
			problem: 'Vereinfache: √50 - √18 = ?√2',
			answer: '2',
			inputType: 'text',
			placeholder: 'Nur die Zahl vor √2'
		},
		{
			id: 3,
			name: 'Regal',
			problem: 'Berechne: 3√2 + 5√2 - 2√2 = ?√2',
			answer: '6',
			inputType: 'text',
			placeholder: 'Nur die Zahl vor √2',
			requiresCompleted: [6]
		},
		{
			id: 4,
			name: 'Fenster',
			problem: 'Multipliziere: √3 · √12',
			answer: '6',
			inputType: 'text',
			placeholder: 'Nur die Zahl',
			requiresSun: true
		},
		{
			id: 2,
			name: 'Tafel',
			problem: 'Löse die Gleichung: √(x+5) = 7',
			answer: '44',
			inputType: 'text',
			placeholder: 'Nur die Zahl',
			requiresCompleted: [4]
		},
		{
			id: 1,
			name: 'Tresor',
			problem: 'Vereinfache die Wurzel: √72 = ?√2',
			answer: '6',
			inputType: 'text',
			placeholder: 'Nur die Zahl vor √2',
			requiresCompleted: [2]
		},
		{
			id: 5,
			name: 'Tür',
			problem: 'Rationalisiere den Nenner: 6/√3',
			answer: '2√3',
			inputType: 'multiple',
			options: ['2√3', '6√3', '√3', '3√2'],
			requiresCatFed: true
		}
	];



	useEffect(() => {
		const topLetters = topBooks.map(book => book.letter).join('');
		const bottomLetters = bottomBooks.map(book => book.letter).join('');
		const isCorrect = topLetters === 'MOND' && bottomLetters === 'SONNE';

		if (isCorrect && !booksCorrect) {
			playSound('booksSolved');
			setBooksCorrect(true);
		} else if (!isCorrect && booksCorrect) {
			setBooksCorrect(false);
		}
	}, [topBooks, bottomBooks, booksCorrect]);

	useEffect(() => {
		if (gameStarted && timeLeft > 0 && !gameWon) {
			const timer = setInterval(() => {
				setTimeLeft(prev => prev - 1);
			}, 1000);
			return () => clearInterval(timer);
		}
	}, [gameStarted, timeLeft, gameWon]);

	const formatTime = (seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	const handleSubmit = (answer = userAnswer) => {
		const station = stations.find(s => s.id === currentStation);
		const normalizedAnswer = answer.replace(/\s/g, '').toLowerCase();
		const normalizedCorrect = station.answer.replace(/\s/g, '').toLowerCase();

		if (normalizedAnswer === normalizedCorrect) {
			playSound('correct');
			setFeedback({ type: 'success', message: 'Richtig! Station gelöst!' });
			setCompletedStations([...completedStations, currentStation]);
			setTimeout(() => {
				setCurrentStation(null);
				setUserAnswer('');
				setFeedback(null);
			}, 1500);
		} else {
			playSound('wrong');
			setFeedback({ type: 'error', message: 'Leider falsch. Versuche es nochmal!' });
		}
	};

	const canOpenStation = (stationId) => {
		const station = stations.find(s => s.id === stationId);
		if (!station) return false;
		if (completedStations.includes(stationId)) return false;

		if (stationId === 3 && !booksCorrect) return false;

		if (station.requiresCompleted) {
			return station.requiresCompleted.every(id => completedStations.includes(id));
		}
		if (station.requiresSun) {
			return sunInWindow;
		}
		if (station.requiresCatFed) {
			return catFed;
		}
		return true;
	};

	const openStation = (stationId) => {
		if (canOpenStation(stationId)) {
			setCurrentStation(stationId);
			setUserAnswer('');
			setFeedback(null);
		}
	};

	const handleSunMouseDown = (e) => {
		if (sunInWindow || !completedStations.includes(3)) return;
		e.preventDefault();
		setDraggingSun(true);
		const svg = e.currentTarget.ownerSVGElement;
		const pt = svg.createSVGPoint();
		const clientX = e.touches ? e.touches[0].clientX : e.clientX;
		const clientY = e.touches ? e.touches[0].clientY : e.clientY;
		pt.x = clientX;
		pt.y = clientY;
		const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
		setSunPosition({ x: svgP.x, y: svgP.y });
	};

	const handleFoodMouseDown = (e) => {
		if (catFed || !completedStations.includes(1)) return;
		e.preventDefault();
		setDraggingFood(true);
		const svg = e.currentTarget.ownerSVGElement;
		const pt = svg.createSVGPoint();
		const clientX = e.touches ? e.touches[0].clientX : e.clientX;
		const clientY = e.touches ? e.touches[0].clientY : e.clientY;
		pt.x = clientX;
		pt.y = clientY;
		const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
		setFoodPosition({ x: svgP.x, y: svgP.y });
	};

	const handleMouseMove = (e) => {
		if (!draggingSun && !draggingFood && !draggingBook) return;
		e.preventDefault();
		const svg = e.currentTarget;
		const pt = svg.createSVGPoint();
		const clientX = e.touches ? e.touches[0].clientX : e.clientX;
		const clientY = e.touches ? e.touches[0].clientY : e.clientY;
		pt.x = clientX;
		pt.y = clientY;
		const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

		if (draggingSun) {
			setSunPosition({ x: svgP.x, y: svgP.y });
		} else if (draggingFood) {
			setFoodPosition({ x: svgP.x, y: svgP.y });
		} else if (draggingBook) {
			setDragStartPos({ x: svgP.x, y: svgP.y });
		}
	};

	const handleMouseUp = (e) => {
		if (!draggingSun && !draggingFood && !draggingBook) return;
		e.preventDefault();
		const svg = e.currentTarget;
		const pt = svg.createSVGPoint();
		const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
		const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
		pt.x = clientX;
		pt.y = clientY;
		const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

		if (draggingSun) {
			setDraggingSun(false);
			if (svgP.x >= 230 && svgP.x <= 380 && svgP.y >= 80 && svgP.y <= 280) {
				setSunInWindow(true);
				playSound('sun');
			} else {
				setSunPosition({ x: 0, y: 0 });
			}
		} else if (draggingFood) {
			setDraggingFood(false);
			if (svgP.x >= 45 && svgP.x <= 95 && svgP.y >= 640 && svgP.y <= 670) {
				setCatFed(true);
				playSound('cat');
			} else {
				setFoodPosition({ x: 0, y: 0 });
			}
		} else if (draggingBook) {
			const { row, fromIndex } = draggingBook;
			const bookWidth = 28;
			const isTopRow = row === 'top';
			const maxBooks = isTopRow ? 4 : 5;
			const startX = isTopRow ? 696 : 680;

			let targetIndex = -1;
			for (let idx = 0; idx < maxBooks; idx++) {
				const bookX = startX + idx * (bookWidth + 4);
				if (svgP.x >= bookX && svgP.x <= bookX + bookWidth) {
					targetIndex = idx;
					break;
				}
			}

			if (targetIndex !== -1 && targetIndex !== fromIndex) {
				playSound('click');
				if (row === 'top') {
					const newBooks = [...topBooks];
					const [removed] = newBooks.splice(fromIndex, 1);
					newBooks.splice(targetIndex, 0, removed);
					setTopBooks(newBooks);
				} else {
					const newBooks = [...bottomBooks];
					const [removed] = newBooks.splice(fromIndex, 1);
					newBooks.splice(targetIndex, 0, removed);
					setBottomBooks(newBooks);
				}
			}

			setDraggingBook(null);
			setDragStartPos({ x: 0, y: 0 });
		}
	};

	if (!gameStarted) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center p-4">
				<div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl text-center">
					<h1 className="text-5xl font-bold text-purple-600 mb-6">Rootscape</h1>
					<p className="text-2xl text-gray-500 mb-4">
						Ein Point-and-Click-Rechenspiel
					</p>
					<p className="text-lg text-gray-700 mb-8">
						Du und deine Katze wollt raus – aber wie? Die Tür lässt sich im Moment einfach nicht öffnen...
					</p>
					<button
						onClick={() => setGameStarted(true)}
						className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xl py-4 px-12 rounded-full transition-all transform hover:scale-105"
					>
						Spiel starten
					</button>
				</div>
			</div>
		);
	}

	if (gameWon) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center p-4">
				<div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl text-center">
					<Trophy className="w-32 h-32 mx-auto text-yellow-500 mb-6" />
					<h1 className="text-5xl font-bold text-green-600 mb-6">Geschafft!</h1>
					<p className="text-2xl text-gray-700 mb-4">
						Du hast alle Rätsel gelöst und bist entkommen!
					</p>
					<p className="text-xl text-gray-600 mb-8">
						Verbleibende Zeit: {formatTime(timeLeft)}
					</p>
					<button
						onClick={() => {
							const books = getInitialBooks();
							setGameStarted(false);
							setCompletedStations([]);
							setTimeLeft(10 * 60);
							setGameWon(false);
							setSunInWindow(false);
							setCatFed(false);
							setBooksCorrect(false);
							setTopBooks(books.top);
							setBottomBooks(books.bottom);
						}}
						className="bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-4 px-12 rounded-full transition-all"
					>
						Nochmal spielen
					</button>
				</div>
			</div>
		);
	}

	if (timeLeft === 0) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center p-4">
				<div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl text-center">
					<XCircle className="w-32 h-32 mx-auto text-red-500 mb-6" />
					<h1 className="text-5xl font-bold text-red-600 mb-6">Zeit abgelaufen!</h1>
					<p className="text-xl text-gray-700 mb-8">
						Du hast {completedStations.length} von {stations.length} Stationen gelöst.
					</p>
					<button
						onClick={() => {
							const books = getInitialBooks();
							setGameStarted(false);
							setCompletedStations([]);
							setTimeLeft(10 * 60);
							setSunInWindow(false);
							setCatFed(false);
							setBooksCorrect(false);
							setTopBooks(books.top);
							setBottomBooks(books.bottom);
						}}
						className="bg-red-600 hover:bg-red-700 text-white font-bold text-xl py-4 px-12 rounded-full transition-all"
					>
						Nochmal versuchen
					</button>
				</div>
			</div>
		);
	}

	const currentStationData = stations.find(s => s.id === currentStation);

	return (
		<div className="bg-gradient-to-br from-blue-100 to-purple-100 p-4 min-h-screen flex flex-col items-center justify-start overflow-auto">
			<div className="w-full max-w-6xl mb-4 bg-white rounded-2xl shadow-lg p-4 flex justify-between items-center">
				<div className="flex items-center gap-4">
					<Clock className="w-6 h-6 text-purple-600" />
					<span className="text-2xl font-bold text-gray-800">{formatTime(timeLeft)}</span>
				</div>
				<button
					onClick={() => {
						const books = getInitialBooks();
						setGameStarted(false);
						setCompletedStations([]);
						setTimeLeft(10 * 60);
						setGameWon(false);
						setSunInWindow(false);
						setCatFed(false);
						setCurrentStation(null);
						setBooksCorrect(false);
						setTopBooks(books.top);
						setBottomBooks(books.bottom);
					}}
					className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-xl transition-all"
				>
					Neu beginnen
				</button>
				<div className="flex items-center gap-2">
					<span className="text-lg font-semibold text-gray-700">Fortschritt:</span>
					<span className="text-xl font-bold text-purple-600">
						{completedStations.length}/{stations.length}
					</span>
				</div>
			</div>

			<div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl p-4 md:p-8 flex items-center justify-center">
				<svg
					viewBox="0 0 900 700"
					className="w-full h-auto"
					style={{ maxHeight: 'calc(100vh - 180px)', maxWidth: '100%', touchAction: 'none' }}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onMouseLeave={handleMouseUp}
					onTouchMove={handleMouseMove}
					onTouchEnd={handleMouseUp}
				>
					<rect x="0" y="550" width="900" height="150" fill="#FF9680" />
					<rect x="0" y="0" width="900" height="550" fill="#FFF1A1" />
					<rect x="0" y="530" width="900" height="20" fill="#8B7355" />

					<g>
						<rect x="50" y="80" width="150" height="200" fill="#A8DAFF" stroke="#5A9BD5" strokeWidth="4" />
						<line x1="125" y1="80" x2="125" y2="280" stroke="#5A9BD5" strokeWidth="3" />
						<line x1="50" y1="180" x2="200" y2="180" stroke="#5A9BD5" strokeWidth="3" />
					</g>

					<g>
						<rect x="230" y="80" width="150" height="200" fill="#A8DAFF" stroke="#5A9BD5" strokeWidth="4" />

						{sunInWindow && (
							<g>
								<line x1="330" y1="150" x2="330" y2="110" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
								<line x1="330" y1="150" x2="350" y2="115.36" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
								<line x1="330" y1="150" x2="364.64" y2="130" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
								<line x1="330" y1="150" x2="370" y2="150" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
								<line x1="330" y1="150" x2="364.64" y2="170" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
								<line x1="330" y1="150" x2="350" y2="184.64" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
								<line x1="330" y1="150" x2="330" y2="190" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
								<line x1="330" y1="150" x2="310" y2="184.64" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
								<line x1="330" y1="150" x2="295.36" y2="170" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
								<line x1="330" y1="150" x2="290" y2="150" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
								<line x1="330" y1="150" x2="295.36" y2="130" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
								<line x1="330" y1="150" x2="310" y2="115.36" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />

								<circle cx="330" cy="150" r="18" fill="#FFD700" />
							</g>
						)}

						<line x1="305" y1="80" x2="305" y2="280" stroke="#5A9BD5" strokeWidth="3" />
						<line x1="230" y1="180" x2="380" y2="180" stroke="#5A9BD5" strokeWidth="3" />
					</g>

					<g
						onClick={() => openStation(4)}
						style={{ cursor: canOpenStation(4) ? 'pointer' : 'default', pointerEvents: canOpenStation(4) || completedStations.includes(4) ? 'auto' : 'none' }}
					>
						<rect x="230" y="80" width="150" height="200" fill="transparent" />
					</g>

					{!completedStations.includes(5) ? (
						<g onClick={() => openStation(5)} style={{ cursor: canOpenStation(5) ? 'pointer' : 'default' }}>
							<rect x="410" y="150" width="200" height="400" fill="#AA96DA" stroke="#7B68AA" strokeWidth="4" rx="5" />
							<circle cx="570" cy="300" r="8" fill="#FFD700" stroke="#333" strokeWidth="2" />
							<line x1="415" y1="200" x2="605" y2="200" stroke="#9B86C4" strokeWidth="2" opacity="0.3" />
							<line x1="415" y1="300" x2="605" y2="300" stroke="#9B86C4" strokeWidth="2" opacity="0.3" />
						</g>
					) : (
						<g onClick={() => { playSound('win'); setGameWon(true); }} style={{ cursor: 'pointer' }}>
							<rect x="410" y="150" width="200" height="230" fill="#87CEEB" />

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

							<rect x="410" y="380" width="200" height="150" fill="#7CFC00" />

							<line x1="420" y1="530" x2="422" y2="500" stroke="#228B22" strokeWidth="2" />
							<line x1="423" y1="530" x2="425" y2="505" stroke="#2E7D32" strokeWidth="2" />
							<line x1="428" y1="530" x2="430" y2="495" stroke="#1B5E20" strokeWidth="2" />
							<line x1="432" y1="530" x2="434" y2="510" stroke="#228B22" strokeWidth="2" />
							<line x1="437" y1="530" x2="439" y2="500" stroke="#2E7D32" strokeWidth="2" />
							<line x1="442" y1="530" x2="444" y2="505" stroke="#1B5E20" strokeWidth="2" />
							<line x1="448" y1="530" x2="450" y2="510" stroke="#228B22" strokeWidth="2" />
							<line x1="415" y1="485" x2="417" y2="460" stroke="#228B22" strokeWidth="2" />
							<line x1="425" y1="495" x2="427" y2="465" stroke="#2E7D32" strokeWidth="2" />
							<line x1="435" y1="488" x2="437" y2="460" stroke="#1B5E20" strokeWidth="2" />
							<line x1="420" y1="430" x2="422" y2="405" stroke="#228B22" strokeWidth="2" />
							<line x1="430" y1="425" x2="432" y2="400" stroke="#2E7D32" strokeWidth="2" />

							<line x1="460" y1="530" x2="463" y2="505" stroke="#228B22" strokeWidth="2" />
							<line x1="475" y1="530" x2="477" y2="500" stroke="#2E7D32" strokeWidth="2" />
							<line x1="490" y1="530" x2="492" y2="510" stroke="#1B5E20" strokeWidth="2" />
							<line x1="470" y1="475" x2="472" y2="450" stroke="#228B22" strokeWidth="2" />
							<line x1="485" y1="482" x2="487" y2="455" stroke="#2E7D32" strokeWidth="2" />
							<line x1="495" y1="478" x2="497" y2="455" stroke="#1B5E20" strokeWidth="2" />
							<line x1="460" y1="420" x2="462" y2="395" stroke="#228B22" strokeWidth="2" />
							<line x1="480" y1="425" x2="482" y2="400" stroke="#2E7D32" strokeWidth="2" />

							<line x1="505" y1="530" x2="507" y2="510" stroke="#228B22" strokeWidth="2" />
							<line x1="510" y1="530" x2="512" y2="505" stroke="#2E7D32" strokeWidth="2" />
							<line x1="515" y1="530" x2="517" y2="515" stroke="#1B5E20" strokeWidth="2" />
							<line x1="520" y1="530" x2="522" y2="505" stroke="#228B22" strokeWidth="2" />
							<line x1="525" y1="530" x2="527" y2="510" stroke="#2E7D32" strokeWidth="2" />
							<line x1="530" y1="530" x2="532" y2="500" stroke="#1B5E20" strokeWidth="2" />
							<line x1="535" y1="530" x2="537" y2="515" stroke="#228B22" strokeWidth="2" />
							<line x1="540" y1="530" x2="542" y2="508" stroke="#2E7D32" strokeWidth="2" />
							<line x1="510" y1="480" x2="512" y2="455" stroke="#228B22" strokeWidth="2" />
							<line x1="520" y1="485" x2="522" y2="460" stroke="#2E7D32" strokeWidth="2" />
							<line x1="530" y1="478" x2="532" y2="450" stroke="#1B5E20" strokeWidth="2" />
							<line x1="505" y1="413" x2="507" y2="390" stroke="#228B22" strokeWidth="2" />
							<line x1="520" y1="417" x2="522" y2="395" stroke="#2E7D32" strokeWidth="2" />
							<line x1="535" y1="410" x2="537" y2="388" stroke="#1B5E20" strokeWidth="2" />

							<line x1="550" y1="530" x2="552" y2="515" stroke="#228B22" strokeWidth="2" />
							<line x1="565" y1="530" x2="567" y2="510" stroke="#2E7D32" strokeWidth="2" />
							<line x1="580" y1="530" x2="582" y2="515" stroke="#1B5E20" strokeWidth="2" />
							<line x1="595" y1="530" x2="597" y2="510" stroke="#228B22" strokeWidth="2" />
							<line x1="555" y1="475" x2="557" y2="455" stroke="#228B22" strokeWidth="2" />
							<line x1="575" y1="482" x2="577" y2="460" stroke="#2E7D32" strokeWidth="2" />
							<line x1="600" y1="478" x2="602" y2="455" stroke="#1B5E20" strokeWidth="2" />
							<line x1="550" y1="415" x2="552" y2="395" stroke="#228B22" strokeWidth="2" />
							<line x1="590" y1="423" x2="592" y2="400" stroke="#2E7D32" strokeWidth="2" />

							<g>
								<ellipse cx="530" cy="385" rx="18" ry="20" fill="#2E7D32" />
								<ellipse cx="522" cy="383" rx="12" ry="15" fill="#388E3C" />
								<ellipse cx="538" cy="381" rx="14" ry="16" fill="#43A047" />

								<ellipse cx="550" cy="390" rx="15" ry="18" fill="#2E7D32" />
								<ellipse cx="545" cy="388" rx="10" ry="13" fill="#388E3C" />
								<ellipse cx="555" cy="387" rx="11" ry="14" fill="#43A047" />

								<ellipse cx="450" cy="360" rx="20" ry="22" fill="#2E7D32" />
								<ellipse cx="442" cy="358" rx="13" ry="16" fill="#388E3C" />
								<ellipse cx="458" cy="356" rx="15" ry="17" fill="#43A047" />

								<ellipse cx="580" cy="362" rx="17" ry="19" fill="#2E7D32" />
								<ellipse cx="574" cy="360" rx="11" ry="14" fill="#388E3C" />
								<ellipse cx="586" cy="359" rx="12" ry="15" fill="#43A047" />
							</g>

							<g transform="translate(540, 470) scale(0.8)">
								<ellipse cx="0" cy="30" rx="35" ry="12" fill="#000000" opacity="0.15" />

								<path d="M -35,0 Q -50,-10 -55,-30 Q -58,-50 -52,-65"
									fill="none" stroke="#E67E22" strokeWidth="12" strokeLinecap="round" />
								<path d="M -35,0 Q -50,-10 -55,-30 Q -58,-50 -52,-65"
									fill="none" stroke="#F39C12" strokeWidth="8" strokeLinecap="round" />

								<ellipse cx="-20" cy="10" rx="18" ry="25" fill="#E67E22" />
								<ellipse cx="-5" cy="-20" rx="30" ry="35" fill="#E67E22" />
								<ellipse cx="-2" cy="-10" rx="20" ry="25" fill="#F5CBA7" />

								<rect x="-18" y="0" width="12" height="28" fill="#E67E22" rx="3" />
								<ellipse cx="-12" cy="28" rx="7" ry="5" fill="#D35400" />
								<rect x="-2" y="2" width="12" height="26" fill="#E67E22" rx="3" />
								<ellipse cx="4" cy="28" rx="7" ry="5" fill="#D35400" />

								<ellipse cx="10" cy="-30" rx="15" ry="18" fill="#E67E22" />
								<ellipse cx="18" cy="-45" rx="22" ry="24" fill="#E67E22" />
								<ellipse cx="22" cy="-42" rx="14" ry="16" fill="#F5CBA7" />

								<path d="M 0,-60 L -5,-80 L 10,-65 Z" fill="#E67E22" />
								<path d="M 28,-62 L 33,-82 L 18,-67 Z" fill="#E67E22" />

								<circle cx="16" cy="-48" r="5" fill="#7CB342" />
								<ellipse cx="16" cy="-48" rx="1.5" ry="4" fill="#000000" />
								<circle cx="15" cy="-50" r="1.2" fill="#FFFFFF" />

								<circle cx="28" cy="-48" r="5" fill="#7CB342" />
								<ellipse cx="28" cy="-48" rx="1.5" ry="4" fill="#000000" />
								<circle cx="27" cy="-50" r="1.2" fill="#FFFFFF" />

								<path d="M 22,-40 L 20,-38 L 24,-38 Z" fill="#FF69B4" />
								<path d="M 22,-38 Q 16,-32 13,-35" fill="none" stroke="#000000" strokeWidth="1.3" strokeLinecap="round" />
								<path d="M 22,-38 Q 28,-32 31,-35" fill="none" stroke="#000000" strokeWidth="1.3" strokeLinecap="round" />

								<line x1="5" y1="-44" x2="-12" y2="-46" stroke="#333333" strokeWidth="0.8" opacity="0.7" />
								<line x1="39" y1="-44" x2="56" y2="-46" stroke="#333333" strokeWidth="0.8" opacity="0.7" />
							</g>
						</g>
					)}

					<g>
						<rect x="710" y="120" width="140" height="180" fill="#FFF9E6" stroke="#DDB868" strokeWidth="4" />
						<polygon points="725,270 750,220 775,270" fill="#8B7355" />
						<polygon points="770,270 795,210 820,270" fill="#6B5345" />

						{completedStations.includes(3) && !sunInWindow && !draggingSun && (
							<g
								style={{ cursor: 'grab' }}
								onMouseDown={handleSunMouseDown}
								onTouchStart={handleSunMouseDown}
							>
								<line x1="800" y1="175" x2="800" y2="150" stroke="#FFD700" strokeWidth="1.25" strokeLinecap="round" />
								<line x1="800" y1="175" x2="812.5" y2="159.15" stroke="#FFD700" strokeWidth="1.25" strokeLinecap="round" />
								<line x1="800" y1="175" x2="821.65" y2="162.5" stroke="#FFD700" strokeWidth="1.25" strokeLinecap="round" />
								<line x1="800" y1="175" x2="825" y2="175" stroke="#FFD700" strokeWidth="1.25" strokeLinecap="round" />
								<line x1="800" y1="175" x2="821.65" y2="187.5" stroke="#FFD700" strokeWidth="1.25" strokeLinecap="round" />
								<line x1="800" y1="175" x2="812.5" y2="190.85" stroke="#FFD700" strokeWidth="1.25" strokeLinecap="round" />
								<line x1="800" y1="175" x2="800" y2="200" stroke="#FFD700" strokeWidth="1.25" strokeLinecap="round" />
								<line x1="800" y1="175" x2="787.5" y2="190.85" stroke="#FFD700" strokeWidth="1.25" strokeLinecap="round" />
								<line x1="800" y1="175" x2="778.35" y2="187.5" stroke="#FFD700" strokeWidth="1.25" strokeLinecap="round" />
								<line x1="800" y1="175" x2="775" y2="175" stroke="#FFD700" strokeWidth="1.25" strokeLinecap="round" />
								<line x1="800" y1="175" x2="778.35" y2="162.5" stroke="#FFD700" strokeWidth="1.25" strokeLinecap="round" />
								<line x1="800" y1="175" x2="787.5" y2="159.15" stroke="#FFD700" strokeWidth="1.25" strokeLinecap="round" />

								<circle cx="800" cy="175" r="11.25" fill="#FFD700" />
							</g>
						)}

						{!completedStations.includes(3) && (
							<>
								<circle cx="800" cy="175" r="18" fill="#C0C0C0" />
								<circle cx="796" cy="171" r="16" fill="#E8E8E8" />
							</>
						)}

						{draggingSun && (
							<g style={{ cursor: 'grabbing', opacity: 0.8 }} pointerEvents="none">
								<line x1={sunPosition.x} y1={sunPosition.y} x2={sunPosition.x} y2={sunPosition.y - 25} stroke="#FFD700" strokeWidth="1.25" strokeLinecap="round" />
								<line x1={sunPosition.x} y1={sunPosition.y} x2={sunPosition.x + 12.5} y2={sunPosition.y - 15.4} stroke="#FFD700" strokeWidth="1.25" strokeLinecap="round" />
								<line x1={sunPosition.x} y1={sunPosition.y} x2={sunPosition.x + 21.65} y2={sunPosition.y - 12.5} stroke="#FFD700" strokeWidth="1.25" strokeLinecap="round" />
								<line x1={sunPosition.x} y1={sunPosition.y} x2={sunPosition.x + 25} y2={sunPosition.y} stroke="#FFD700" strokeWidth="1.25" strokeLinecap="round" />
								<line x1={sunPosition.x} y1={sunPosition.y} x2={sunPosition.x + 21.65} y2={sunPosition.y + 12.5} stroke="#FFD700" strokeWidth="1.25" strokeLinecap="round" />
								<line x1={sunPosition.x} y1={sunPosition.y} x2={sunPosition.x + 12.5} y2={sunPosition.y + 15.4} stroke="#FFD700" strokeWidth="1.25" strokeLinecap="round" />
								<line x1={sunPosition.x} y1={sunPosition.y} x2={sunPosition.x} y2={sunPosition.y + 25} stroke="#FFD700" strokeWidth="1.25" strokeLinecap="round" />
								<line x1={sunPosition.x} y1={sunPosition.y} x2={sunPosition.x - 12.5} y2={sunPosition.y + 15.4} stroke="#FFD700" strokeWidth="1.25" strokeLinecap="round" />
								<line x1={sunPosition.x} y1={sunPosition.y} x2={sunPosition.x - 21.65} y2={sunPosition.y + 12.5} stroke="#FFD700" strokeWidth="1.25" strokeLinecap="round" />
								<line x1={sunPosition.x} y1={sunPosition.y} x2={sunPosition.x - 25} y2={sunPosition.y} stroke="#FFD700" strokeWidth="1.25" strokeLinecap="round" />
								<line x1={sunPosition.x} y1={sunPosition.y} x2={sunPosition.x - 21.65} y2={sunPosition.y - 12.5} stroke="#FFD700" strokeWidth="1.25" strokeLinecap="round" />
								<line x1={sunPosition.x} y1={sunPosition.y} x2={sunPosition.x - 12.5} y2={sunPosition.y - 15.4} stroke="#FFD700" strokeWidth="1.25" strokeLinecap="round" />

								<circle cx={sunPosition.x} cy={sunPosition.y} r="11.25" fill="#FFD700" />
							</g>
						)}

						<rect x="725" y="270" width="95" height="20" fill="#7CFC00" />
						<polygon points="735,265 745,250 755,265" fill="#228B22" />
						<polygon points="785,265 795,245 805,265" fill="#228B22" />
					</g>

					<g>
						{!catFed && (
							<>
								<ellipse cx="70" cy="665" rx="25" ry="8" fill="#E0E0E0" />
								<path d="M 45 660 L 55 645 L 85 645 L 95 660 Z" fill="#C0C0C0" stroke="#888888" strokeWidth="2" />
								<ellipse cx="70" cy="645" rx="15" ry="5" fill="#D0D0D0" stroke="#888888" strokeWidth="1.5" />
							</>
						)}

						{catFed && (
							<>
								<ellipse cx="70" cy="665" rx="25" ry="8" fill="#E0E0E0" />
								<path d="M 45 660 L 55 645 L 85 645 L 95 660 Z" fill="#C0C0C0" stroke="#888888" strokeWidth="2" />
								<ellipse cx="70" cy="645" rx="15" ry="5" fill="#D0D0D0" stroke="#888888" strokeWidth="1.5" />

								<g>
									<line x1="50" y1="650" x2="90" y2="650" stroke="#333333" strokeWidth="4" />
									<circle cx="70" cy="651" r="4" fill="#333333" />

									<line x1="56" y1="650" x2="52" y2="644" stroke="#333333" strokeWidth="2.2" />
									<line x1="60" y1="650" x2="56" y2="644" stroke="#333333" strokeWidth="2.2" />
									<line x1="64" y1="650" x2="60" y2="644" stroke="#333333" strokeWidth="2.2" />
									<line x1="68" y1="650" x2="66" y2="643" stroke="#333333" strokeWidth="2.2" />
									<line x1="72" y1="650" x2="74" y2="643" stroke="#333333" strokeWidth="2.2" />
									<line x1="76" y1="650" x2="80" y2="644" stroke="#333333" strokeWidth="2.2" />
									<line x1="80" y1="650" x2="84" y2="644" stroke="#333333" strokeWidth="2.2" />
									<line x1="84" y1="650" x2="88" y2="644" stroke="#333333" strokeWidth="2.2" />

									<line x1="56" y1="650" x2="52" y2="656" stroke="#333333" strokeWidth="2.2" />
									<line x1="60" y1="650" x2="56" y2="656" stroke="#333333" strokeWidth="2.2" />
									<line x1="64" y1="650" x2="60" y2="656" stroke="#333333" strokeWidth="2.2" />
									<line x1="68" y1="650" x2="66" y2="657" stroke="#333333" strokeWidth="2.2" />
									<line x1="72" y1="650" x2="74" y2="657" stroke="#333333" strokeWidth="2.2" />
									<line x1="76" y1="650" x2="80" y2="656" stroke="#333333" strokeWidth="2.2" />
									<line x1="80" y1="650" x2="84" y2="656" stroke="#333333" strokeWidth="2.2" />
									<line x1="84" y1="650" x2="88" y2="656" stroke="#333333" strokeWidth="2.2" />

									<path d="M 50 650 L 44 648 L 46 653 Z" fill="#333333" />
									<path d="M 90 650 L 96 648 L 94 653 Z" fill="#333333" />
								</g>
							</>
						)}

						{(!completedStations.includes(5) || !catFed) && (
							<>
								<ellipse cx={catFed && !completedStations.includes(5) ? 510 : 120} cy={catFed && !completedStations.includes(5) ? 560 : 630} rx="35" ry="12" fill="#000000" opacity="0.15" />

								<path d={catFed ? "M 475,530 Q 460,520 455,500 Q 452,480 458,465" : "M 85,600 Q 70,590 65,570 Q 62,550 68,535"}
									fill="none" stroke="#E67E22" strokeWidth="12" strokeLinecap="round" />
								<path d={catFed ? "M 475,530 Q 460,520 455,500 Q 452,480 458,465" : "M 85,600 Q 70,590 65,570 Q 62,550 68,535"}
									fill="none" stroke="#F39C12" strokeWidth="8" strokeLinecap="round" />

								<ellipse cx={catFed ? 490 : 100} cy={catFed ? 540 : 610} rx="18" ry="25" fill="#E67E22" />
								<ellipse cx={catFed ? 505 : 115} cy={catFed ? 510 : 580} rx="30" ry="35" fill="#E67E22" />
								<ellipse cx={catFed ? 508 : 118} cy={catFed ? 520 : 590} rx="20" ry="25" fill="#F5CBA7" />

								<rect x={catFed ? 492 : 102} y={catFed ? 530 : 600} width="12" height="28" fill="#E67E22" rx="3" />
								<ellipse cx={catFed ? 498 : 108} cy={catFed ? 558 : 628} rx="7" ry="5" fill="#D35400" />
								<rect x={catFed ? 508 : 118} y={catFed ? 532 : 602} width="12" height="26" fill="#E67E22" rx="3" />
								<ellipse cx={catFed ? 514 : 124} cy={catFed ? 558 : 628} rx="7" ry="5" fill="#D35400" />

								<ellipse cx={catFed ? 520 : 130} cy={catFed ? 500 : 570} rx="15" ry="18" fill="#E67E22" />
								<ellipse cx={catFed ? 528 : 138} cy={catFed ? 485 : 555} rx="22" ry="24" fill="#E67E22" />
								<ellipse cx={catFed ? 532 : 142} cy={catFed ? 488 : 558} rx="14" ry="16" fill="#F5CBA7" />

								<path d={catFed ? "M 510,470 L 505,450 L 520,465 Z" : "M 120,540 L 115,520 L 130,535 Z"} fill="#E67E22" />
								<path d={catFed ? "M 512,468 L 508,455 L 518,465 Z" : "M 122,538 L 118,525 L 128,535 Z"} fill="#FFA07A" />
								<path d={catFed ? "M 538,468 L 543,448 L 528,463 Z" : "M 148,538 L 153,518 L 138,533 Z"} fill="#E67E22" />
								<path d={catFed ? "M 536,466 L 540,453 L 530,463 Z" : "M 146,536 L 150,523 L 140,533 Z"} fill="#FFA07A" />

								<circle cx={catFed ? 526 : 136} cy={catFed ? 482 : 552} r="5" fill="#7CB342" />
								<ellipse cx={catFed ? 526 : 136} cy={catFed ? 482 : 552} rx="1.5" ry="4" fill="#000000" />
								<circle cx={catFed ? 525 : 135} cy={catFed ? 480 : 550} r="1.2" fill="#FFFFFF" />

								<circle cx={catFed ? 538 : 148} cy={catFed ? 482 : 552} r="5" fill="#7CB342" />
								<ellipse cx={catFed ? 538 : 148} cy={catFed ? 482 : 552} rx="1.5" ry="4" fill="#000000" />
								<circle cx={catFed ? 537 : 147} cy={catFed ? 480 : 550} r="1.2" fill="#FFFFFF" />

								<path d={catFed ? "M 532,490 L 530,492 L 534,492 Z" : "M 142,560 L 140,562 L 144,562 Z"} fill="#FF69B4" />
								<path d={catFed ? "M 532,492 Q 526,498 523,495" : "M 142,562 Q 136,568 133,565"} fill="none" stroke="#000000" strokeWidth="1.3" strokeLinecap="round" />
								<path d={catFed ? "M 532,492 Q 538,498 541,495" : "M 142,562 Q 148,568 151,565"} fill="none" stroke="#000000" strokeWidth="1.3" strokeLinecap="round" />

								<line x1={catFed ? 515 : 125} y1={catFed ? 486 : 556} x2={catFed ? 498 : 108} y2={catFed ? 484 : 554} stroke="#333333" strokeWidth="0.8" opacity="0.7" />
								<line x1={catFed ? 549 : 159} y1={catFed ? 486 : 556} x2={catFed ? 566 : 176} y2={catFed ? 484 : 554} stroke="#333333" strokeWidth="0.8" opacity="0.7" />
							</>
						)}
					</g>

					<g onClick={() => openStation(2)} style={{ cursor: canOpenStation(2) ? 'pointer' : 'default' }}>
						<rect x="50" y="330" width="300" height="180" fill="#6B6B6B" stroke="#1A1A1A" strokeWidth="4" />
						<text x="200" y="430" textAnchor="middle" fill="#FFFFFF" fontSize="32" fontFamily="Arial">
							{completedStations.includes(4) ? '√(x+5) = 7' : '√x² = |x|'}
						</text>
					</g>

					{completedStations.includes(2) && (
						<g onClick={() => openStation(1)} style={{ cursor: canOpenStation(1) ? 'pointer' : 'default' }}>
							<rect x="125" y="360" width="100" height="120" fill="#4A4A4A" stroke="#2A2A2A" strokeWidth="3" rx="5" />
							{!completedStations.includes(1) ? (
								<>
									<rect x="135" y="370" width="80" height="100" fill="#5A5A5A" stroke="#3A3A3A" strokeWidth="2" />
									<circle cx="175" cy="410" r="15" fill="#FFD700" stroke="#333" strokeWidth="2" />
									<circle cx="175" cy="410" r="6" fill="#333" />
									<line x1="175" y1="410" x2="175" y2="400" stroke="#333" strokeWidth="3" />
									<rect x="185" y="445" width="20" height="6" fill="#C0C0C0" stroke="#333" strokeWidth="2" rx="2" />
								</>
							) : (
								<>
									<rect x="125" y="370" width="50" height="100" fill="#5A5A5A" stroke="#3A3A3A" strokeWidth="2" />
									<rect x="175" y="370" width="50" height="100" fill="#3A3A3A" />

									{!catFed && !draggingFood && (
										<g
											style={{ cursor: 'grab' }}
											onMouseDown={handleFoodMouseDown}
											onTouchStart={handleFoodMouseDown}
										>
											<ellipse cx="200" cy="415" rx="18" ry="9" fill="#4A9EDA" />
											<ellipse cx="200" cy="417" rx="16" ry="7" fill="#5DADE2" />

											<path d="M 182 415 L 172 404 L 182 404 L 182 426 L 172 426 Z" fill="#2E86C1" />
											<path d="M 218 415 L 228 404 L 218 404 L 218 426 L 228 426 Z" fill="#2E86C1" />
											<path d="M 200 406 L 192 392 L 200 398 L 208 392 Z" fill="#1F618D" />
											<path d="M 200 424 L 192 438 L 200 432 L 208 438 Z" fill="#1F618D" />

											<circle cx="195" cy="413" r="2" fill="#000000" />
											<circle cx="194" cy="412" r="0.8" fill="#FFFFFF" />
											<circle cx="205" cy="413" r="2" fill="#000000" />
											<circle cx="206" cy="412" r="0.8" fill="#FFFFFF" />
											<path d="M 195 418 Q 200 416 205 418" fill="none" stroke="#3A7CA5" strokeWidth="0.8" />
											<path d="M 197 420 Q 200 419 203 420" fill="none" stroke="#3A7CA5" strokeWidth="0.6" />
											<line x1="192" y1="413" x2="196" y2="413" stroke="#2E86C1" strokeWidth="0.5" />
											<line x1="204" y1="413" x2="208" y2="413" stroke="#2E86C1" strokeWidth="0.5" />
											<line x1="192" y1="417" x2="196" y2="417" stroke="#2E86C1" strokeWidth="0.5" />
											<line x1="204" y1="417" x2="208" y2="417" stroke="#2E86C1" strokeWidth="0.5" />
										</g>
									)}

									{draggingFood && (
										<g style={{ cursor: 'grabbing', opacity: 0.8 }} pointerEvents="none">
											<ellipse cx={foodPosition.x} cy={foodPosition.y} rx="18" ry="9" fill="#4A9EDA" />
											<ellipse cx={foodPosition.x} cy={foodPosition.y + 2} rx="16" ry="7" fill="#5DADE2" />
											<path d={`M ${foodPosition.x - 18} ${foodPosition.y} L ${foodPosition.x - 24} ${foodPosition.y - 7} L ${foodPosition.x - 18} ${foodPosition.y - 7} L ${foodPosition.x - 18} ${foodPosition.y + 7} L ${foodPosition.x - 24} ${foodPosition.y + 7} Z`} fill="#2E86C1" />
											<path d={`M ${foodPosition.x + 18} ${foodPosition.y} L ${foodPosition.x + 24} ${foodPosition.y - 7} L ${foodPosition.x + 18} ${foodPosition.y - 7} L ${foodPosition.x + 18} ${foodPosition.y + 7} L ${foodPosition.x + 24} ${foodPosition.y + 7} Z`} fill="#2E86C1" />
											<path d={`M ${foodPosition.x} ${foodPosition.y - 9} L ${foodPosition.x - 6} ${foodPosition.y - 18} L ${foodPosition.x} ${foodPosition.y - 14} L ${foodPosition.x + 6} ${foodPosition.y - 18} Z`} fill="#1F618D" />
											<path d={`M ${foodPosition.x} ${foodPosition.y + 9} L ${foodPosition.x - 6} ${foodPosition.y + 18} L ${foodPosition.x} ${foodPosition.y + 14} L ${foodPosition.x + 6} ${foodPosition.y + 18} Z`} fill="#1F618D" />
											<circle cx={foodPosition.x - 5} cy={foodPosition.y - 2} r="2" fill="#000000" />
											<circle cx={foodPosition.x - 6} cy={foodPosition.y - 3} r="0.8" fill="#FFFFFF" />
											<circle cx={foodPosition.x + 5} cy={foodPosition.y - 2} r="2" fill="#000000" />
											<circle cx={foodPosition.x + 6} cy={foodPosition.y - 3} r="0.8" fill="#FFFFFF" />
											<path d={`M ${foodPosition.x - 5} ${foodPosition.y + 3} Q ${foodPosition.x} ${foodPosition.y + 1} ${foodPosition.x + 5} ${foodPosition.y + 3}`} fill="none" stroke="#3A7CA5" strokeWidth="0.8" />
											<line x1={foodPosition.x - 8} y1={foodPosition.y - 2} x2={foodPosition.x - 4} y2={foodPosition.y - 2} stroke="#2E86C1" strokeWidth="0.5" />
											<line x1={foodPosition.x + 4} y1={foodPosition.y - 2} x2={foodPosition.x + 8} y2={foodPosition.y - 2} stroke="#2E86C1" strokeWidth="0.5" />
											<line x1={foodPosition.x - 8} y1={foodPosition.y + 2} x2={foodPosition.x - 4} y2={foodPosition.y + 2} stroke="#2E86C1" strokeWidth="0.5" />
											<line x1={foodPosition.x + 4} y1={foodPosition.y + 2} x2={foodPosition.x + 8} y2={foodPosition.y + 2} stroke="#2E86C1" strokeWidth="0.5" />
										</g>
									)}
								</>
							)}
						</g>
					)}

					<g onClick={() => openStation(3)} style={{ cursor: canOpenStation(3) ? 'pointer' : 'default' }}>
						<rect x="670" y="330" width="180" height="220" fill="#A8D8D0" stroke="#5FA899" strokeWidth="3" />
						<rect x="670" y="340" width="180" height="10" fill="#95E1D3" stroke="#5FA899" strokeWidth="2" />
						<rect x="670" y="420" width="180" height="10" fill="#95E1D3" stroke="#5FA899" strokeWidth="2" />
						<rect x="670" y="500" width="180" height="10" fill="#95E1D3" stroke="#5FA899" strokeWidth="2" />

						{!booksCorrect && topBooks.map((book, bookIdx) => (
							<g
								key={`top-${bookIdx}`}
								style={{ cursor: completedStations.includes(6) ? 'grab' : 'default' }}
								onMouseDown={(e) => {
									if (!completedStations.includes(6)) return;
									setDraggingBook({ row: 'top', fromIndex: bookIdx, letter: book.letter, color: book.color });
									const svg = e.currentTarget.ownerSVGElement;
									const pt = svg.createSVGPoint();
									pt.x = e.clientX;
									pt.y = e.clientY;
									const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
									setDragStartPos({ x: svgP.x, y: svgP.y });
									e.stopPropagation();
								}}
								onTouchStart={(e) => {
									if (!completedStations.includes(6)) return;
									e.preventDefault();
									setDraggingBook({ row: 'top', fromIndex: bookIdx, letter: book.letter, color: book.color });
									const svg = e.currentTarget.ownerSVGElement;
									const pt = svg.createSVGPoint();
									pt.x = e.touches[0].clientX;
									pt.y = e.touches[0].clientY;
									const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
									setDragStartPos({ x: svgP.x, y: svgP.y });
									e.stopPropagation();
								}}
							>
								<rect x={696 + bookIdx * 32} y="350" width="28" height="65" fill={book.color} opacity={draggingBook && draggingBook.row === 'top' && draggingBook.fromIndex === bookIdx ? 0.3 : 1} />
								<text x={710 + bookIdx * 32} y="385" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial" opacity={draggingBook && draggingBook.row === 'top' && draggingBook.fromIndex === bookIdx ? 0.3 : 1}>{book.letter}</text>
							</g>
						))}

						{!booksCorrect && bottomBooks.map((book, bookIdx) => (
							<g
								key={`bottom-${bookIdx}`}
								style={{ cursor: completedStations.includes(6) ? 'grab' : 'default' }}
								onMouseDown={(e) => {
									if (!completedStations.includes(6)) return;
									setDraggingBook({ row: 'bottom', fromIndex: bookIdx, letter: book.letter, color: book.color });
									const svg = e.currentTarget.ownerSVGElement;
									const pt = svg.createSVGPoint();
									pt.x = e.clientX;
									pt.y = e.clientY;
									const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
									setDragStartPos({ x: svgP.x, y: svgP.y });
									e.stopPropagation();
								}}
								onTouchStart={(e) => {
									if (!completedStations.includes(6)) return;
									e.preventDefault();
									setDraggingBook({ row: 'bottom', fromIndex: bookIdx, letter: book.letter, color: book.color });
									const svg = e.currentTarget.ownerSVGElement;
									const pt = svg.createSVGPoint();
									pt.x = e.touches[0].clientX;
									pt.y = e.touches[0].clientY;
									const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
									setDragStartPos({ x: svgP.x, y: svgP.y });
									e.stopPropagation();
								}}
							>
								<rect x={680 + bookIdx * 32} y="430" width="28" height="65" fill={book.color} opacity={draggingBook && draggingBook.row === 'bottom' && draggingBook.fromIndex === bookIdx ? 0.3 : 1} />
								<text x={694 + bookIdx * 32} y="465" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial" opacity={draggingBook && draggingBook.row === 'bottom' && draggingBook.fromIndex === bookIdx ? 0.3 : 1}>{book.letter}</text>
							</g>
						))}

						{draggingBook && (
							<g style={{ cursor: 'grabbing' }} pointerEvents="none">
								<rect
									x={dragStartPos.x - 14}
									y={dragStartPos.y - 32.5}
									width="28"
									height="65"
									fill={draggingBook.color}
									opacity="0.7"
									stroke="#000000"
									strokeWidth="2"
								/>
								<text
									x={dragStartPos.x}
									y={dragStartPos.y + 2.5}
									textAnchor="middle"
									fill="white"
									fontSize="24"
									fontWeight="bold"
									fontFamily="Arial"
									opacity="0.7"
								>
									{draggingBook.letter}
								</text>
							</g>
						)}

						{booksCorrect && (
							<>
								<rect x="696" y="350" width="28" height="65" fill="#E74C3C" />
								<text x="710" y="385" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">M</text>
								<rect x="728" y="350" width="28" height="65" fill="#3498DB" />
								<text x="742" y="385" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">O</text>
								<rect x="760" y="350" width="28" height="65" fill="#F39C12" />
								<text x="774" y="385" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">N</text>
								<rect x="792" y="350" width="28" height="65" fill="#9B59B6" />
								<text x="806" y="385" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">D</text>

								<rect x="680" y="430" width="28" height="65" fill="#2ECC71" />
								<text x="694" y="465" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">S</text>
								<rect x="712" y="430" width="28" height="65" fill="#E67E22" />
								<text x="726" y="465" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">O</text>
								<rect x="744" y="430" width="28" height="65" fill="#16A085" />
								<text x="758" y="465" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">N</text>
								<rect x="776" y="430" width="28" height="65" fill="#C0392B" />
								<text x="790" y="465" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">N</text>
								<rect x="808" y="430" width="28" height="65" fill="#8E44AD" />
								<text x="822" y="465" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">E</text>
							</>
						)}
					</g>

					<g>
						<rect x="200" y="610" width="400" height="20" fill="#8B7355" stroke="#654321" strokeWidth="2" />
						<rect x="220" y="630" width="20" height="100" fill="#654321" stroke="#4A3621" strokeWidth="2" />
						<rect x="560" y="630" width="20" height="100" fill="#654321" stroke="#4A3621" strokeWidth="2" />
						<rect x="360" y="630" width="20" height="100" fill="#654321" stroke="#4A3621" strokeWidth="2" />
						<rect x="500" y="630" width="20" height="100" fill="#654321" stroke="#4A3621" strokeWidth="2" />
					</g>

					<g>
						<ellipse cx="350" cy="610" rx="18" ry="6" fill="#E8E8E8" />
						<rect x="332" y="590" width="36" height="20" fill="#FFFFFF" stroke="#4A90E2" strokeWidth="2" rx="3" />
						<ellipse cx="350" cy="590" rx="18" ry="6" fill="#FFFFFF" stroke="#4A90E2" strokeWidth="2" />
						<path d="M 368 595 Q 380 600 380 605 Q 380 610 368 605" fill="none" stroke="#4A90E2" strokeWidth="2" />

						<ellipse cx="420" cy="610" rx="24" ry="8" fill="#D0D0D0" />
						<path d="M 396 575 Q 396 560 400 552 Q 405 545 420 545 Q 435 545 440 552 Q 444 560 444 575 L 444 610 L 396 610 Z" fill="#FFFFFF" stroke="#2E5C8A" strokeWidth="2.5" />

						<path d="M 398 585 Q 398 575 402 570 Q 407 565 420 565 Q 433 565 438 570 Q 442 575 442 585 L 442 610 L 398 610 Z" fill="#87CEEB" opacity="0.7" />
						<ellipse cx="420" cy="585" rx="22" ry="7" fill="#5DADE2" opacity="0.5" />

						<ellipse cx="420" cy="575" rx="26" ry="9" fill="none" stroke="#2E5C8A" strokeWidth="2" />
						<path d="M 444 582 Q 457 584 460 592 Q 457 600 444 597" fill="none" stroke="#2E5C8A" strokeWidth="2.5" strokeLinecap="round" />
					</g>

					<g onClick={() => openStation(6)} style={{ cursor: canOpenStation(6) ? 'pointer' : 'default' }}>
						<ellipse cx="800" cy="640" rx="35" ry="18" fill="#A0522D" />
						<rect x="765" y="600" width="70" height="40" fill="#A0522D" />
						<ellipse cx="800" cy="600" rx="35" ry="18" fill="#8B4513" />
						<ellipse cx="800" cy="602" rx="30" ry="12" fill="#654321" />
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
				</svg>
			</div>

			{currentStationData && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-3xl font-bold text-purple-600">{currentStationData.name}</h2>
							<button
								onClick={() => setCurrentStation(null)}
								className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
							>
								×
							</button>
						</div>

						<div className="bg-purple-50 rounded-2xl p-6 mb-6">
							<p className="text-xl text-gray-800 font-semibold mb-4">
								{currentStationData.problem}
							</p>

							{currentStationData.inputType === 'text' ? (
								<input
									type="text"
									value={userAnswer}
									onChange={(e) => setUserAnswer(e.target.value)}
									onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
									placeholder={currentStationData.placeholder}
									className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl text-lg focus:outline-none focus:border-purple-500"
									autoFocus
								/>
							) : (
								<div className="grid grid-cols-2 gap-3">
									{currentStationData.options.map((option, optIdx) => (
										<button
											key={optIdx}
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
							<div className={`mb-4 p-4 rounded-xl flex items-center gap-3 ${
								feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
							}`}>
								{feedback.type === 'success' ? (
									<CheckCircle className="w-6 h-6" />
								) : (
									<XCircle className="w-6 h-6" />
								)}
								<span className="font-semibold">{feedback.message}</span>
							</div>
						)}

						{currentStationData.inputType === 'text' && (
							<button
								onClick={() => handleSubmit()}
								className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xl py-3 rounded-xl transition-all"
							>
								Antwort prüfen
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default EscaperoomGame;

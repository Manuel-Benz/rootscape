// Ein gemeinsamer AudioContext für das ganze Spiel.
// Browser erlauben Audio erst nach einer Nutzer-Interaktion, deshalb muss
// unlockAudio() aus einem Klick-/Touch-Handler heraus aufgerufen werden.
let ctx = null;

function getCtx() {
	if (typeof window === 'undefined') return null;
	if (!ctx) {
		const AC = window.AudioContext || window.webkitAudioContext;
		if (!AC) return null;
		ctx = new AC();
	}
	if (ctx.state === 'suspended') {
		ctx.resume();
	}
	return ctx;
}

// Versucht, den AudioContext zu starten. Gibt true zurück, wenn er läuft.
// Ohne Nutzer-Interaktion klappt das nur, wenn der Browser Autoplay erlaubt
// (z.B. Chrome bei hoher Media-Engagement für die Seite).
export function resumeAudio() {
	const ctx = getCtx();
	if (!ctx) return false;
	if (ctx.state !== 'running') {
		ctx.resume().catch(() => {});
	}
	return ctx.state === 'running';
}

// Ruft cb auf, sobald der AudioContext (auch asynchron) in 'running' wechselt.
// Gibt eine Unsubscribe-Funktion zurück.
export function onAudioRunning(cb) {
	const ctx = getCtx();
	if (!ctx) return () => {};
	const handler = () => {
		if (ctx.state === 'running') cb();
	};
	ctx.addEventListener('statechange', handler);
	return () => ctx.removeEventListener('statechange', handler);
}

// Weißes Rauschen für die Hi-Hat einmal erzeugen und wiederverwenden
let noiseBuffer = null;

function getNoiseBuffer(audioCtx) {
	if (!noiseBuffer || noiseBuffer.sampleRate !== audioCtx.sampleRate) {
		noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.04, audioCtx.sampleRate);
		const data = noiseBuffer.getChannelData(0);
		for (let i = 0; i < data.length; i++) {
			data[i] = Math.random() * 2 - 1;
		}
	}
	return noiseBuffer;
}

export function playSound(type) {
	try {
		const audioContext = getCtx();
		if (!audioContext) return;
		const oscillator = audioContext.createOscillator();
		const gainNode = audioContext.createGain();

		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);

		oscillator.type = 'sine';
		const now = audioContext.currentTime;

		switch (type) {
			case 'correct':
				oscillator.frequency.setValueAtTime(523.25, now);
				oscillator.frequency.setValueAtTime(659.25, now + 0.1);
				oscillator.frequency.setValueAtTime(783.99, now + 0.2);
				gainNode.gain.setValueAtTime(0.3, now);
				gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
				oscillator.start(now);
				oscillator.stop(now + 0.4);
				break;

			case 'wrong':
				oscillator.frequency.setValueAtTime(200, now);
				oscillator.frequency.setValueAtTime(150, now + 0.15);
				gainNode.gain.setValueAtTime(0.3, now);
				gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
				oscillator.start(now);
				oscillator.stop(now + 0.3);
				break;

			case 'click':
				oscillator.frequency.setValueAtTime(600, now);
				gainNode.gain.setValueAtTime(0.15, now);
				gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
				oscillator.start(now);
				oscillator.stop(now + 0.08);
				break;

			case 'booksSolved':
				oscillator.frequency.setValueAtTime(523.25, now);
				oscillator.frequency.setValueAtTime(659.25, now + 0.1);
				oscillator.frequency.setValueAtTime(783.99, now + 0.15);
				oscillator.frequency.setValueAtTime(1046.5, now + 0.25);
				gainNode.gain.setValueAtTime(0.35, now);
				gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
				oscillator.start(now);
				oscillator.stop(now + 0.5);
				break;

			case 'sun':
				oscillator.frequency.setValueAtTime(400, now);
				oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.3);
				gainNode.gain.setValueAtTime(0.3, now);
				gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
				oscillator.start(now);
				oscillator.stop(now + 0.35);
				break;

			case 'cat':
				oscillator.type = 'sawtooth';
				oscillator.frequency.setValueAtTime(600, now);
				oscillator.frequency.linearRampToValueAtTime(400, now + 0.1);
				oscillator.frequency.setValueAtTime(500, now + 0.15);
				oscillator.frequency.linearRampToValueAtTime(300, now + 0.3);
				gainNode.gain.setValueAtTime(0.25, now);
				gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.32);
				oscillator.start(now);
				oscillator.stop(now + 0.32);
				break;

			case 'win':
				oscillator.frequency.setValueAtTime(523.25, now);
				oscillator.frequency.setValueAtTime(659.25, now + 0.15);
				oscillator.frequency.setValueAtTime(783.99, now + 0.3);
				oscillator.frequency.setValueAtTime(1046.5, now + 0.45);
				gainNode.gain.setValueAtTime(0.3, now);
				gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
				oscillator.start(now);
				oscillator.stop(now + 0.7);
				break;

			default:
				break;
		}
	} catch {
		// Audio nicht verfügbar – still ignorieren
	}
}

// Startet die Intro-Musik und gibt eine Stop-Funktion zurück.
export function startIntroMusic() {
	const audioCtx = getCtx();
	if (!audioCtx) return () => {};

	const master = audioCtx.createGain();
	master.gain.value = 0.3;
	master.connect(audioCtx.destination);

	let stopped = false;
	let loopTimeout = null;

	const note = (type, freq, time, duration, volume = 0.4) => {
		const osc = audioCtx.createOscillator();
		const gain = audioCtx.createGain();
		osc.type = type;
		osc.frequency.value = freq;
		osc.connect(gain);
		gain.connect(master);
		gain.gain.setValueAtTime(0, time);
		gain.gain.linearRampToValueAtTime(volume, time + 0.01);
		gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
		osc.start(time);
		osc.stop(time + duration);
	};

	const kick = (time) => {
		const osc = audioCtx.createOscillator();
		const gain = audioCtx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(160, time);
		osc.frequency.exponentialRampToValueAtTime(50, time + 0.15);
		osc.connect(gain);
		gain.connect(master);
		gain.gain.setValueAtTime(0.8, time);
		gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
		osc.start(time);
		osc.stop(time + 0.15);
	};

	const hihat = (time) => {
		const noise = audioCtx.createBufferSource();
		noise.buffer = getNoiseBuffer(audioCtx);
		const gain = audioCtx.createGain();
		gain.gain.value = 0.08;
		noise.connect(gain);
		gain.connect(master);
		noise.start(time);
	};

	const tempo = 110;
	const beat = 60 / tempo;
	const melody = [440, 523, 587, 659, 587, 523, 440, 392];
	const bass = [110, 110, 98, 98, 82, 82, 98, 110];

	const playPhrase = () => {
		if (stopped) return;

		const startTime = audioCtx.currentTime + 0.1;

		for (let i = 0; i < 8; i++) {
			const t = startTime + i * beat;
			note('sawtooth', melody[i], t, beat * 0.8, 0.25);
			note('square', bass[i], t, beat, 0.2);
			if (i % 2 === 0) kick(t);
			hihat(t + beat / 2);
		}

		const buildStart = startTime + 8 * beat;
		for (let i = 0; i < 4; i++) {
			const t = buildStart + i * beat;
			note('sawtooth', melody[i], t, beat * 0.8, 0.28);
			note('square', bass[i], t, beat, 0.25);
			kick(t);
			hihat(t + beat / 2);
		}

		const arp = [440, 523, 659, 880, 523, 659, 784, 988];
		for (let i = 0; i < arp.length; i++) {
			const t = buildStart + i * (beat / 4);
			note('sawtooth', arp[i], t, beat / 4, 0.4);
		}

		const pedalFreqs = [55, 110, 220];
		for (let i = 0; i < 32; i++) {
			const t = buildStart + i * (beat / 4);
			pedalFreqs.forEach((f, idx) => {
				const vol = idx === 0 ? 0.1 : idx === 1 ? 0.12 : 0.08;
				note('triangle', f, t, beat / 4, vol);
			});
		}

		const fillStart = buildStart + 4 * beat;
		const fillNotes = [880, 784, 659, 523, 659, 523, 440, 880];
		for (let i = 0; i < fillNotes.length; i++) {
			const t = fillStart + i * (beat / 4);
			note('sawtooth', fillNotes[i], t, beat / 4, 0.35);
			if (i % 2 === 0) kick(t);
			hihat(t);
		}

		const finalTime = buildStart + 6 * beat;
		note('sawtooth', 880, finalTime, beat * 2, 0.5);
		kick(finalTime);
		hihat(finalTime + beat / 4);
		hihat(finalTime + beat / 2);

		loopTimeout = setTimeout(playPhrase, 16 * beat * 1000);
	};

	playPhrase();

	return () => {
		stopped = true;
		clearTimeout(loopTimeout);
		// Ausblenden statt hart abschneiden, dann Knoten freigeben
		const now = audioCtx.currentTime;
		master.gain.cancelScheduledValues(now);
		master.gain.setValueAtTime(master.gain.value, now);
		master.gain.linearRampToValueAtTime(0.0001, now + 0.25);
		setTimeout(() => master.disconnect(), 400);
	};
}

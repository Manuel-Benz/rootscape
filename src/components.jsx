import React from 'react';

// Sonne mit Strahlenkranz
export const Sun = ({ x, y, r = 18 }) => {
	const rays = Array.from({ length: 12 }, (_, i) => {
		const a = (i * Math.PI) / 6;
		return {
			x1: x + Math.cos(a) * r * 1.25,
			y1: y + Math.sin(a) * r * 1.25,
			x2: x + Math.cos(a) * r * 1.95,
			y2: y + Math.sin(a) * r * 1.95,
		};
	});
	return (
		<g>
			{rays.map((l, i) => (
				<line key={i} {...l} stroke="#FFD700" strokeWidth={Math.max(1.5, r * 0.13)} strokeLinecap="round" />
			))}
			<circle cx={x} cy={y} r={r} fill="#FFD700" />
			<circle cx={x - r * 0.28} cy={y - r * 0.28} r={r * 0.5} fill="#FFE566" />
		</g>
	);
};

// Sitzende Tigerkatze, Ursprung: Brustmitte, Pfoten bei y≈+60
export const Cat = ({ x, y, scale = 1 }) => (
	<g transform={`translate(${x} ${y}) scale(${scale})`}>
		{/* Schatten */}
		<ellipse cx="4" cy="62" rx="44" ry="9" fill="#000000" opacity="0.12" />

		{/* Schwanz */}
		<path d="M 26,50 Q 58,54 63,26 Q 66,6 54,-2" fill="none" stroke="#D35400" strokeWidth="13" strokeLinecap="round" />
		<path d="M 26,50 Q 58,54 63,26 Q 66,6 54,-2" fill="none" stroke="#F39C12" strokeWidth="8" strokeLinecap="round" />
		<circle cx="54" cy="-3" r="6" fill="#F8D9B0" />

		{/* Körper */}
		<path d="M -36,60 Q -44,18 -22,-10 Q 0,-26 22,-10 Q 44,18 36,60 Q 20,65 0,65 Q -20,65 -36,60 Z" fill="#E67E22" />

		{/* Fellstreifen */}
		<path d="M 24,4 q 10,6 13,17" stroke="#C95E12" strokeWidth="5" fill="none" strokeLinecap="round" />
		<path d="M 29,26 q 7,7 8,15" stroke="#C95E12" strokeWidth="5" fill="none" strokeLinecap="round" />
		<path d="M -25,6 q -9,7 -11,17" stroke="#C95E12" strokeWidth="5" fill="none" strokeLinecap="round" />

		{/* Brust / Bauch */}
		<path d="M -16,62 Q -22,26 0,10 Q 22,26 16,62 Q 0,66 -16,62 Z" fill="#F8D9B0" />

		{/* Vorderbeine + Pfoten */}
		<rect x="-15" y="26" width="11" height="34" rx="5" fill="#E67E22" />
		<rect x="4" y="26" width="11" height="34" rx="5" fill="#EE7F2D" />
		<ellipse cx="-9" cy="60" rx="8" ry="5" fill="#F8D9B0" />
		<ellipse cx="9" cy="60" rx="8" ry="5" fill="#F8D9B0" />

		{/* Ohren */}
		<path d="M -24,-58 L -30,-84 L -8,-70 Z" fill="#E67E22" />
		<path d="M -21,-61 L -25,-76 L -12,-67 Z" fill="#F1948A" />
		<path d="M 24,-58 L 30,-84 L 8,-70 Z" fill="#E67E22" />
		<path d="M 21,-61 L 25,-76 L 12,-67 Z" fill="#F1948A" />

		{/* Kopf */}
		<circle cx="0" cy="-46" r="27" fill="#E67E22" />

		{/* Kopfstreifen */}
		<path d="M -10,-70 q 1,5 0,9" stroke="#C95E12" strokeWidth="3.5" fill="none" strokeLinecap="round" />
		<path d="M 0,-72 q 0,5 0,10" stroke="#C95E12" strokeWidth="3.5" fill="none" strokeLinecap="round" />
		<path d="M 10,-70 q -1,5 0,9" stroke="#C95E12" strokeWidth="3.5" fill="none" strokeLinecap="round" />

		{/* Schnauze */}
		<ellipse cx="0" cy="-34" rx="11" ry="8" fill="#F8D9B0" />

		{/* Augen */}
		<ellipse cx="-11" cy="-46" rx="5.5" ry="6.5" fill="#7CB342" />
		<ellipse cx="-11" cy="-46" rx="2" ry="5" fill="#141414" />
		<circle cx="-12.5" cy="-49" r="1.4" fill="#FFFFFF" />
		<ellipse cx="11" cy="-46" rx="5.5" ry="6.5" fill="#7CB342" />
		<ellipse cx="11" cy="-46" rx="2" ry="5" fill="#141414" />
		<circle cx="9.5" cy="-49" r="1.4" fill="#FFFFFF" />

		{/* Nase + Mund */}
		<path d="M -3.2,-38.5 L 3.2,-38.5 L 0,-34.5 Z" fill="#E8778A" />
		<path d="M 0,-34.5 Q -4,-30 -8,-32.5" stroke="#9C5A1D" strokeWidth="1.4" fill="none" strokeLinecap="round" />
		<path d="M 0,-34.5 Q 4,-30 8,-32.5" stroke="#9C5A1D" strokeWidth="1.4" fill="none" strokeLinecap="round" />

		{/* Schnurrhaare */}
		<line x1="-14" y1="-36" x2="-31" y2="-38" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.8" />
		<line x1="-14" y1="-32" x2="-30" y2="-30" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.8" />
		<line x1="14" y1="-36" x2="31" y2="-38" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.8" />
		<line x1="14" y1="-32" x2="30" y2="-30" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.8" />
	</g>
);

// Futterfisch (Dose), Ursprung: Mitte
export const FishFood = ({ x, y, opacity = 1 }) => (
	<g transform={`translate(${x} ${y})`} opacity={opacity}>
		<ellipse cx="0" cy="0" rx="18" ry="9" fill="#4A9EDA" />
		<ellipse cx="0" cy="2" rx="16" ry="7" fill="#5DADE2" />
		<path d="M -18,0 L -24,-7 L -18,-7 L -18,7 L -24,7 Z" fill="#2E86C1" />
		<path d="M 18,0 L 24,-7 L 18,-7 L 18,7 L 24,7 Z" fill="#2E86C1" />
		<path d="M 0,-9 L -6,-18 L 0,-14 L 6,-18 Z" fill="#1F618D" />
		<path d="M 0,9 L -6,18 L 0,14 L 6,18 Z" fill="#1F618D" />
		<circle cx="-5" cy="-2" r="2" fill="#000000" />
		<circle cx="-6" cy="-3" r="0.8" fill="#FFFFFF" />
		<circle cx="5" cy="-2" r="2" fill="#000000" />
		<circle cx="6" cy="-3" r="0.8" fill="#FFFFFF" />
		<path d="M -5,3 Q 0,1 5,3" fill="none" stroke="#3A7CA5" strokeWidth="0.8" />
	</g>
);

// Futternapf; zeigt nach dem Füttern eine Fischgräte
export const Bowl = ({ x, y, eaten }) => (
	<g transform={`translate(${x} ${y})`}>
		<ellipse cx="0" cy="12" rx="30" ry="6" fill="#000000" opacity="0.1" />
		<path d="M -26,-6 Q -26,12 0,12 Q 26,12 26,-6 Z" fill="#5DADE2" />
		<ellipse cx="0" cy="-6" rx="26" ry="7" fill="#3E8DC5" />
		<ellipse cx="0" cy="-6" rx="20" ry="5" fill="#21618C" />
		{eaten && (
			<g>
				<line x1="-13" y1="-7" x2="13" y2="-7" stroke="#ECF0F1" strokeWidth="2.4" strokeLinecap="round" />
				{[-8, -3, 2, 7].map((rx) => (
					<g key={rx}>
						<line x1={rx} y1="-7" x2={rx - 3} y2="-11" stroke="#ECF0F1" strokeWidth="1.6" strokeLinecap="round" />
						<line x1={rx} y1="-7" x2={rx - 3} y2="-3" stroke="#ECF0F1" strokeWidth="1.6" strokeLinecap="round" />
					</g>
				))}
				<circle cx="16" cy="-7" r="3.2" fill="#ECF0F1" />
				<path d="M -13,-7 L -19,-11 L -19,-3 Z" fill="#ECF0F1" />
			</g>
		)}
	</g>
);

// Becher, Ursprung: Standfläche
export const Mug = ({ x, y }) => (
	<g transform={`translate(${x} ${y})`}>
		<ellipse cx="2" cy="1" rx="18" ry="4" fill="#000000" opacity="0.1" />
		<path d="M 14,-26 Q 27,-24 27,-16 Q 27,-8 14,-6" fill="none" stroke="#D5DBDD" strokeWidth="5" strokeLinecap="round" />
		<path d="M -14,-34 L -14,-3 Q -14,1 -9,1 L 9,1 Q 14,1 14,-3 L 14,-34 Z" fill="#ECF0F1" />
		<path d="M 6,-34 L 6,-3 Q 6,1 9,1 Q 14,1 14,-3 L 14,-34 Z" fill="#D5DBDD" />
		<ellipse cx="0" cy="-34" rx="14" ry="4.5" fill="#BDC3C7" />
		<ellipse cx="0" cy="-34" rx="11" ry="3.2" fill="#8B5A2B" />
	</g>
);

// Wasserkrug, Ursprung: Standfläche
export const Jug = ({ x, y }) => (
	<g transform={`translate(${x} ${y})`}>
		<ellipse cx="2" cy="1" rx="26" ry="5" fill="#000000" opacity="0.1" />
		<path d="M 20,-50 Q 34,-46 34,-32 Q 34,-20 20,-18" fill="none" stroke="#B9D9EE" strokeWidth="6" strokeLinecap="round" />
		<path d="M -22,-8 Q -27,-32 -18,-52 Q -10,-64 0,-64 Q 10,-64 18,-52 Q 27,-32 22,-8 Q 20,0 0,0 Q -20,0 -22,-8 Z" fill="#D6EAF8" />
		<path d="M -20,-10 Q -24,-28 -17,-44 L 17,-44 Q 24,-28 20,-10 Q 18,-2 0,-2 Q -18,-2 -20,-10 Z" fill="#85C1E9" />
		<ellipse cx="0" cy="-44" rx="17" ry="4" fill="#AED6F1" />
		<ellipse cx="0" cy="-63" rx="12" ry="3.5" fill="#EBF5FB" />
		<path d="M -12,-64 L -20,-70 L -9,-60 Z" fill="#D6EAF8" />
	</g>
);

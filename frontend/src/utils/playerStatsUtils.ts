import { IPlayerStats } from '../../../common';

export const assemblePlayers = (players: IPlayerStats[]) => {
	let addedSteamIds: Set<string> = new Set();
	let result: IPlayerStats[] = [];
	for (const player of players) {
		if (!addedSteamIds.has(player.steamId)) {
			result.push({ ...player });
			addedSteamIds.add(player.steamId);
		} else {
			for (const rplayer of result) {
				if (rplayer.steamId === player.steamId) {
					const i = result.indexOf(rplayer);
					result[i].kills += player.kills;
					result[i].deaths += player.deaths;
					result[i].assists += player.assists;
					result[i].hits += player.hits;
					result[i].headshots += player.headshots;
					result[i].rounds += player.rounds;
					result[i].damages += player.damages;
					continue;
				}
			}
		}
	}

	return result.map(calculatePlayerRatios);
};

export const calculatePlayerRatios = (player: IPlayerStats) => {
	player.kd = parseFloat((player.kills / player.deaths).toFixed(2));
	player.hsPct = parseFloat(((player.headshots / player.hits) * 100).toFixed(2));
	player.adr = parseFloat((player.damages / player.rounds).toFixed(2));

	return player;
};

// Get an oklch color for a value in a range
export const getStatColor = (value: number | string, lowest: number, highest: number) => {
	if (typeof value === 'string') {
		value = Number(value);
	}
	const lightness = 0.79;
	const chroma = 0.125;
	const hue_low = 20;
	const hue_high = 154;
	let hue: number;
	if (value <= lowest) {
		hue = hue_low;
	} else if (value >= highest) {
		hue = hue_high;
	} else {
		hue = hue_low + ((value - lowest) / (highest - lowest)) * (hue_high - hue_low);
	}
	return `oklch(${lightness * 100}% ${chroma} ${hue})`;
};

export const getKDColor = (value: number | string) => {
	return getStatColor(value, 0, 2.5);
};

export const getHSPctColor = (value: number | string) => {
	return getStatColor(value, 0, 80);
};

export const getADRColor = (value: number | string) => {
	return getStatColor(value, 0, 220);
};

import { EventType } from '../../common';

export const Settings = {
	COMMAND_PREFIXES: ['.', '!'],
	PERIODIC_MESSAGE_FREQUENCY: 30000,
	SAY_PREFIX: process.env['TMT_SAY_PREFIX'] ?? '[TMT] ',
	MATCH_END_ACTION_DELAY: 60000,
	WEBHOOK_EVENTS: [
		'CHAT',
		'KNIFE_END',
		'MAP_ELECTION_END',
		'MAP_END',
		'MAP_START',
		'MATCH_END',
		'MATCH_STOP',
		'ROUND_END',
	] satisfies EventType[] as EventType[],
};

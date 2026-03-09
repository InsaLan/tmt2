import * as fs from 'fs';
import * as path from 'path';
import { IGameServer, IManagedGameServer, IManagedGameServerUpdateDto } from '../../common';
import * as GameServer from './gameServer';
import * as Storage from './storage';
import { SqlAttribute, TableSchema } from './tableSchema';

const managedGameServers = new Map<string, IManagedGameServer>();
const GAME_SERVERS_TABLE = 'gameServers';
const JSON_NAME = 'managed_game_servers.json';

const write = () => {
	Storage.flushDB(GAME_SERVERS_TABLE);
	for (const managedGameServer of managedGameServers.values()) {
		Storage.insertDB(
			GAME_SERVERS_TABLE,
			new Map<string, any>(Object.entries(managedGameServer))
		);
	}
};

const key = (gameServer: IManagedGameServerUpdateDto) => {
	return gameServer.ip + ':' + gameServer.port;
};

export const setup = async () => {
	const attributes = [
		{ name: 'ip', type: 'TEXT' },
		{ name: 'port', type: 'INTEGER' },
		{ name: 'rconPassword', type: 'TEXT' },
		{ name: 'hideRconPassword', type: 'BOOLEAN' },
		{ name: 'usedBy', type: 'TEXT' },
		{ name: 'canBeUsed', type: 'BOOLEAN' },
	] as SqlAttribute[];
	const tableSchema = new TableSchema(GAME_SERVERS_TABLE, attributes, ['ip', 'port']);
	Storage.createTableDB(tableSchema);

	let data: IManagedGameServer[];
	if (fs.existsSync(path.join(Storage.STORAGE_FOLDER, JSON_NAME))) {
		console.log('JSON file found: migrating managed game servers from JSON to SQLite');
		data = await Storage.readJson(JSON_NAME, [] as IManagedGameServer[]);
		fs.renameSync(
			path.join(Storage.STORAGE_FOLDER, JSON_NAME),
			path.join(Storage.STORAGE_FOLDER, JSON_NAME + '.old')
		);
	} else {
		data = Storage.queryDB(`SELECT * FROM ${GAME_SERVERS_TABLE}`) as IManagedGameServer[];
	}

	data.forEach((managedGameServer) => add(managedGameServer, false));
	write();
};

export const get = (ip: string, port: number) => {
	return managedGameServers.get(ip + ':' + port);
};

export const getAll = () => {
	return Array.from(managedGameServers.values());
};

export const add = (managedGameServer: IManagedGameServer, writeToDisk = true) => {
	if (managedGameServers.has(key(managedGameServer))) {
		throw 'This is already a managed game server';
	}
	managedGameServers.set(key(managedGameServer), managedGameServer);
	if (writeToDisk) {
		write();
	}
};

export const update = (dto: IManagedGameServerUpdateDto) => {
	const managedGameServer = managedGameServers.get(key(dto));
	if (!managedGameServer) {
		throw 'This is not a managed game server';
	}
	const updated = { ...managedGameServer, ...dto };
	managedGameServers.set(key(dto), updated);
	write();
	return updated;
};

export const remove = (gameServer: IManagedGameServerUpdateDto) => {
	const removed = managedGameServers.delete(key(gameServer));
	if (removed) {
		write();
	}
};

export const getFree = (matchId: string): IGameServer | undefined => {
	const free = getAll().find(
		(managedGameServer) => managedGameServer.usedBy === null && managedGameServer.canBeUsed
	);
	if (free) {
		free.usedBy = matchId;
		write();
		return {
			ip: free.ip,
			port: free.port,
			rconPassword: free.rconPassword,
			hideRconPassword: true,
		};
	}
	return;
};

export const free = (gameServer: IManagedGameServerUpdateDto, matchId: string) => {
	const managedGameServer = managedGameServers.get(key(gameServer));
	if (managedGameServer?.usedBy === matchId) {
		managedGameServer.usedBy = null;
		write();
	}
};

export const execManyRcon = async (managedGameServer: IManagedGameServer, commands: string[]) => {
	const responses = [];

	const rconConnection = await GameServer.create(
		{
			ip: managedGameServer.ip,
			port: managedGameServer.port,
			rconPassword: managedGameServer.rconPassword,
		},
		(msg) => responses.push(`ERROR: ${msg}`)
	);

	for (let i = 0; i < commands.length; i++) {
		responses.push(await rconConnection.send(commands[i]!));
	}

	try {
		await rconConnection.end();
	} catch (err) {
		responses.push(`ERROR: ${err}`);
	}

	return responses;
};

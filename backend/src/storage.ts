import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import Database from 'better-sqlite3';
import { TableSchema } from './tableSchema';

export const STORAGE_FOLDER = process.env['TMT_STORAGE_FOLDER'] || 'storage';
const DATABASE_PATH = path.join(STORAGE_FOLDER, 'database.sqlite');
if (!fs.existsSync(STORAGE_FOLDER)) {
	fs.mkdirSync(STORAGE_FOLDER, { recursive: true });
}
let DATABASE = new Database(DATABASE_PATH);

function normalizeBindValue(v: any): any {
	if (v === undefined) return null;
	if (v === null) return null;
	if (typeof v === 'boolean') return v ? 1 : 0;
	if (typeof v === 'number' || typeof v === 'string' || typeof v === 'bigint') return v;
	if (Buffer.isBuffer(v)) return v;
	if (v instanceof Date) return v.toISOString();
	// For objects/arrays, store JSON
	try {
		return JSON.stringify(v);
	} catch (e) {
		return String(v);
	}
}

export const setup = async () => {
	await fsp.mkdir(STORAGE_FOLDER, {
		recursive: true,
	});
};

export const writeJson = async <T>(fileName: string, content: T) => {
	await fsp.writeFile(path.join(STORAGE_FOLDER, fileName), JSON.stringify(content, null, 4));
};

type TRead = {
	<T>(fileName: string, fallback: T): Promise<T>;
	<T>(fileName: string, fallback?: T): Promise<T | undefined>;
};
export const readJson: TRead = async <T>(fileName: string, fallback?: T) => {
	try {
		const fullPath = path.join(STORAGE_FOLDER, fileName);
		if (!fs.existsSync(fullPath) && fallback) {
			await writeJson(fileName, fallback);
		}
		const content = await fsp.readFile(fullPath, { encoding: 'utf-8' });
		return JSON.parse(content);
	} catch (err) {
		console.warn(`[DATABASE] ERROR storage read ${fileName}: ${err}. Use fallback.`);
		return fallback;
	}
};

export const appendLineJson = async (fileName: string, content: any) => {
	try {
		await fsp.appendFile(path.join(STORAGE_FOLDER, fileName), JSON.stringify(content) + '\n');
	} catch (err) {
		console.warn(`[DATABASE] ERROR storage appendLine ${fileName}: ${err}`);
	}
};

export const readLinesJson = async (
	fileName: string,
	fallback: Array<any>,
	numberLastOfLines?: number
) => {
	try {
		const fullPath = path.join(STORAGE_FOLDER, fileName);
		if (!fs.existsSync(fullPath) && fallback) {
			throw 'File does not exist';
		}
		const content = await fsp.readFile(fullPath, { encoding: 'utf8' });
		return content
			.split('\n')
			.filter((line) => line.trim().length > 0)
			.map((line) => JSON.parse(line))
			.slice(-(numberLastOfLines ?? 0));
	} catch (err) {
		console.warn(`[DATABASE] ERROR storage readLines ${fileName}: ${err}. Use fallback.`);
		return fallback;
	}
};

export const createTableDB = async (tableSchema: TableSchema): Promise<void> => {
	try {
		DATABASE.exec(`CREATE TABLE IF NOT EXISTS ${tableSchema.generateCreateTableParameters()}`);
	} catch (err: any) {
		console.error('[DATABASE] ERROR creating the table:', err?.message ?? err);
		throw err;
	}
};

export const flushDB = async (table: string): Promise<void> => {
	try {
		DATABASE.exec(`DELETE FROM ${table}`);
	} catch (err: any) {
		console.error('[DATABASE] ERROR flushing the table:', err?.message ?? err);
		throw err;
	}
};

export const insertDB = async (table: string, values: Map<string, any>): Promise<void> => {
	try {
		const columns = Array.from(values.keys()).join(', ');
		const placeholders = Array.from(values.keys())
			.map(() => '?')
			.join(', ');
		const stmt = DATABASE.prepare(`INSERT INTO ${table} (${columns}) VALUES (${placeholders})`);
		const rawValues = Array.from(values.values());
		const bindValues = rawValues.map((v) => normalizeBindValue(v));
		stmt.run(bindValues);
	} catch (err: any) {
		console.error('[DATABASE] ERROR inserting into the database:', err?.message ?? err);
		throw err;
	}
};

export const updateDB = async (
	table: string,
	values: Map<string, any>,
	where: string
): Promise<void> => {
	try {
		const placeholders = Array.from(values.entries())
			.map(([key]) => `${key} = ?`)
			.join(', ');
		const stmt = DATABASE.prepare(`UPDATE ${table} SET ${placeholders} WHERE ${where}`);
		const rawValues = Array.from(values.values());
		const bindValues = rawValues.map((v) => normalizeBindValue(v));
		stmt.run(bindValues);
	} catch (err: any) {
		console.error('[DATABASE] ERROR updating the database:', err?.message ?? err);
		throw err;
	}
};

export const queryDB = async (query: string) => {
	try {
		const stmt = DATABASE.prepare(query);
		const rows = stmt.all();
		return rows;
	} catch (err: any) {
		console.error('[DATABASE] ERROR reading the database:', err?.message ?? err);
		throw err;
	}
};

/**
 * Returns a list of all files in the storage folder which does match the given prefix and suffix.
 * The returned file names still include the prefix and suffix.
 */
export const list = async (prefix: string, suffix: string) => {
	const files = await fsp.readdir(STORAGE_FOLDER);
	return files.filter((fileName) => fileName.startsWith(prefix) && fileName.endsWith(suffix));
};

export const downloadDB = async (): Promise<NodeJS.ReadableStream> => {
	await fs.promises.access(DATABASE_PATH, fs.constants.F_OK);
	const stream = fs.createReadStream(DATABASE_PATH);
	return stream;
};

export const replaceDB = async (buffer: any) => {
	const tempPath = path.join(STORAGE_FOLDER, 'temp.sqlite');
	fs.writeFileSync(tempPath, buffer);
	const tempDb = new Database(tempPath);
	// Verify it's a valid SQLite database
	try {
		try {
			tempDb.prepare('SELECT name FROM sqlite_master LIMIT 1').get();
			tempDb.close();
		} catch (err) {
			tempDb.close();
			fs.unlinkSync(tempPath);
			throw new Error('Invalid SQLite database file');
		}
	} catch (error) {
		throw { status: 415, message: `Invalid file format. Should be an SQLite database.` };
	}
	DATABASE.close();
	fs.renameSync(tempPath, DATABASE_PATH);
	DATABASE = new Database(DATABASE_PATH);
	console.info('[STORAGE] Database replaced successfully.');
};

export const emptyDB = async () => {
	const tables = (
		(await queryDB(
			`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%';`
		)) as Array<{ name: string }>
	).map((table) => table.name);
	for (const table of tables) {
		flushDB(table);
	}
	console.info('[STORAGE] Database emptied successfully.');
};

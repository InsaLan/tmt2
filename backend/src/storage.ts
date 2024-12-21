import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { Database } from 'sqlite3';

export const STORAGE_FOLDER = process.env['TMT_STORAGE_FOLDER'] || 'storage';
export const DATABASE_PATH = path.join(STORAGE_FOLDER, 'database.sqlite');

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
		console.warn(`Error storage read ${fileName}: ${err}. Use fallback.`);
		return fallback;
	}
};

export const appendLineJson = async (fileName: string, content: any) => {
	try {
		await fsp.appendFile(path.join(STORAGE_FOLDER, fileName), JSON.stringify(content) + '\n');
	} catch (err) {
		console.warn(`Error storage appendLine ${fileName}: ${err}`);
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
			throw 'file does not exist';
		}
		const content = await fsp.readFile(fullPath, { encoding: 'utf8' });
		return content
			.split('\n')
			.filter((line) => line.trim().length > 0)
			.map((line) => JSON.parse(line))
			.slice(-(numberLastOfLines ?? 0));
	} catch (err) {
		console.warn(`Error storage readLines ${fileName}: ${err}. Use fallback.`);
		return fallback;
	}
};

export const createTableDB = async (table: string, attributes: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		const db = new Database(DATABASE_PATH);
		db.serialize(() => {
			db.run(`CREATE TABLE IF NOT EXISTS ${table} ${attributes}`, (err) => {
				if (err) {
					console.error('Error creating the table:', err.message);
					reject(err);
					return;
				}
				resolve();
			});
		});
		db.close((err) => {
			if (err) {
				console.error('Error closing the database:', err.message);
				reject(err);
			}
		});
	});
};

export const flushDB = async (table: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		const db = new Database(DATABASE_PATH);
		db.serialize(() => {
			db.run(`DELETE FROM ${table}`, (err) => {
				if (err) {
					console.error('Error creating the table:', err.message);
					reject(err);
					return;
				}
				resolve();
			});
		});
		db.close((err) => {
			if (err) {
				console.error('Error closing the database:', err.message);
				reject(err);
			}
		});
	});
};

export const insertDB = async (table: string, values: Map<string, any>): Promise<void> => {
	return new Promise((resolve, reject) => {
		const db = new Database(DATABASE_PATH);
		db.serialize(() => {
			const columns = Array.from(values.keys()).join(', ');
			const placeholders = Array.from(values.keys())
				.map(() => '?')
				.join(', ');
			const stmt = db.prepare(`INSERT INTO ${table} (${columns}) VALUES (${placeholders})`);
			stmt.run(Array.from(values.values()), (err) => {
				if (err) {
					console.error('Error inserting into the database:', err.message);
					reject(err);
					return;
				}
			});
			stmt.finalize();
			resolve();
		});
		db.close((err) => {
			if (err) {
				console.error('Error closing the database:', err.message);
				reject(err);
			}
		});
	});
};

export const readDB = async (query: string) => {
	return new Promise((resolve, reject) => {
		const db = new Database(DATABASE_PATH);
		db.serialize(() => {
			db.all(query, (err, rows) => {
				if (err) {
					console.error('Error reading the database:', err.message);
					reject(err);
				} else {
					resolve(rows);
				}
			});
		});
		db.close((err) => {
			if (err) {
				console.error('Error closing the database:', err.message);
			}
		});
	});
};

/**
 * Returns a list of all files in the storage folder which does match the given prefix and suffix.
 * The returned file names still include the prefix and suffix.
 */
export const list = async (prefix: string, suffix: string) => {
	const files = await fsp.readdir(STORAGE_FOLDER);
	return files.filter((fileName) => fileName.startsWith(prefix) && fileName.endsWith(suffix));
};

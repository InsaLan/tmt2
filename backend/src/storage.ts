import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';

export const STORAGE_FOLDER = process.env['TMT_STORAGE_FOLDER'] || 'storage';

export const setup = async () => {
	await fsp.mkdir(STORAGE_FOLDER, {
		recursive: true,
	});
};

export const write = async <T>(fileName: string, content: T) => {
	await fsp.writeFile(path.join(STORAGE_FOLDER, fileName), JSON.stringify(content, null, 4));
};

type TRead = {
	<T>(fileName: string, fallback: T): Promise<T>;
	<T>(fileName: string, fallback?: T): Promise<T | undefined>;
};
export const read: TRead = async <T>(fileName: string, fallback?: T) => {
	try {
		const fullPath = path.join(STORAGE_FOLDER, fileName);
		if (!fs.existsSync(fullPath) && fallback) {
			await write(fileName, fallback);
		}
		const content = await fsp.readFile(fullPath, { encoding: 'utf-8' });
		return JSON.parse(content);
	} catch (err) {
		console.warn(`Error storage read ${fileName}: ${err}. Use fallback.`);
		return fallback;
	}
};

export const appendLine = async (fileName: string, content: any) => {
	try {
		await fsp.appendFile(path.join(STORAGE_FOLDER, fileName), JSON.stringify(content) + '\n');
	} catch (err) {
		console.warn(`Error storage appendLine ${fileName}: ${err}`);
	}
};

export const readLines = async (
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

/**
 * Returns a list of all files in the storage folder which does match the given prefix and suffix.
 * The returned file names still include the prefix and suffix.
 */
export const list = async (prefix: string, suffix: string) => {
	const files = await fsp.readdir(STORAGE_FOLDER);
	return files.filter((fileName) => fileName.startsWith(prefix) && fileName.endsWith(suffix));
};

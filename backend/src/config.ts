import { IConfig, IConfigUpdateDto } from '../../common';
import { checkAndNormalizeLogAddress } from './match';
import * as Storage from './storage';

const FILE_NAME = 'config.json';

// These are not defaults, they're temporary until setup() is called
let config: IConfig = {
	tmtLogAddress: null,
	allowUnregisteredMatchCreation: false,
};

const defaults = (): IConfig => {
	let tmtLogAdress = null;
	if (!process.env['TMT_LOG_ADDRESS']) {
		console.warn('Environment variable TMT_LOG_ADDRESS is not set');
		console.warn('Every match must be init with tmtLogAddress');
	} else {
		tmtLogAdress = checkAndNormalizeLogAddress(process.env['TMT_LOG_ADDRESS']);
		if (!tmtLogAdress) {
			throw 'invalid environment variable: TMT_LOG_ADDRESS';
		}
	}

	return {
		tmtLogAddress: tmtLogAdress,
		allowUnregisteredMatchCreation: false,
	};
};

export const get = async (): Promise<IConfig> => {
	return config;
};

export const set = async (data: IConfigUpdateDto) => {
	let tmtLogAdress = null;
	if ('tmtLogAddress' in data && data.tmtLogAddress) {
		tmtLogAdress = checkAndNormalizeLogAddress(data.tmtLogAddress);
		if (!tmtLogAdress) {
			throw 'invalid tmtLogAddress';
		}
	} else if ('tmtLogAddress' in data) {
		tmtLogAdress = null;
	} else {
		tmtLogAdress = config.tmtLogAddress;
	}

	let allowUnregisteredMatchCreation =
		data.allowUnregisteredMatchCreation ?? config.allowUnregisteredMatchCreation;

	config = {
		tmtLogAddress: tmtLogAdress,
		allowUnregisteredMatchCreation: allowUnregisteredMatchCreation,
	};

	await write();

	return config;
};

const write = async () => {
	await Storage.write(FILE_NAME, config);
};

export const setup = async () => {
	// Only get the defaults if the config does not already exist
	const data = await Storage.read(FILE_NAME, defaults());
	set(data);
};

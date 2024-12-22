import { Body, Controller, Get, NoSecurity, Patch, Route, Security } from '@tsoa/runtime';
import { IConfig, IConfigUpdateDto } from '../../common';
import * as Config from './config';

@Route('/api/config')
@Security('bearer_token')
export class ConfigController extends Controller {
	/**
	 * Get some internal config variables.
	 */
	@Get()
	@NoSecurity()
	async getConfig(): Promise<IConfig> {
		return Config.get();
	}

	/**
	 * Update the configuration.
	 */
	@Patch()
	async updateConfig(@Body() requestBody: IConfigUpdateDto): Promise<IConfig> {
		return await Config.set(requestBody);
	}
}

import { Controller, Delete, Get, Post, Route, Security } from '@tsoa/runtime';

import * as Storage from './storage';

@Route('/api/storage')
@Security('bearer_token')
export class StorageController extends Controller {
	/**
	 * Download the DB containing all the stats.
	 */
	@Get('/database')
	async downloadDatabase(): Promise<NodeJS.ReadableStream | void> {
		try {
			this.setHeader('Content-Type', 'application/octet-stream');
			this.setHeader('Content-Disposition', 'attachment; filename=database.sqlite');
			return Storage.downloadDB();
		} catch (error: any) {
			if (error.code === 'ENOENT') {
				this.setStatus(404);
			} else {
				console.log(error);
				this.setStatus(500);
			}
		}
	}

	@Post('/database')
	async replaceDatabase() {}

	@Delete('/database')
	async deleteDatabase() {}

	@Delete('/stats')
	async deleteStats() {}
}
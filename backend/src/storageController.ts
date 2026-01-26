import { Controller, Delete, Get, Post, Route, Security, Request } from '@tsoa/runtime';

import { invalidateStatsCache } from './statsLogger';
import * as Storage from './storage';
import { getAllLive } from './matchService';
import multer from 'multer';

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
	async replaceDatabase(@Request() request: any): Promise<void> {
		if (getAllLive().length > 0) {
			throw { status: 409, message: `Can't modify database while matches are running.` };
		}

		try {
			const upload = multer().single('file');

			await new Promise((resolve, reject) => {
				upload(request, request.res, (err: any) => {
					if (err) reject(err);
					resolve(null);
				});
			});

			if (!request.file) {
				this.setStatus(400);
				return;
			}

			Storage.replaceDB(request.file.buffer);
			invalidateStatsCache();
		} catch (error) {
			console.error(error);
			this.setStatus(500);
		}
	}

	@Delete('/database')
	async emptyDatabase() {
		if (getAllLive().length > 0) {
			throw { status: 409, message: `Can't modify database while matches are running.` };
		}

		Storage.emptyDB();
		invalidateStatsCache();
	}
}

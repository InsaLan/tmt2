import { Controller, Get, Route, Security } from '@tsoa/runtime';

import * as fs from 'fs';
import * as path from 'path';

@Route('/api/storage')
@Security('bearer_token')
export class StorageController extends Controller {
    /**
     * Download the DB containing all the stats.
     */
    @Get('/database')
    async downloadDatabase(): Promise<NodeJS.ReadableStream | void> {
        const dbPath = path.resolve(__dirname, '../storage/database.sqlite');
        try {
            await fs.promises.access(dbPath, fs.constants.F_OK);

            this.setHeader('Content-Type', 'application/octet-stream');
            this.setHeader('Content-Disposition', 'attachment; filename=database.sqlite');

            const stream = fs.createReadStream(dbPath);
            return stream;
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                this.setStatus(404);
            } else {
                console.log(error);
                this.setStatus(500);
            }
        }
    }
}
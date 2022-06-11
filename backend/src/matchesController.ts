import {
	Body,
	Controller,
	Delete,
	Get,
	NoSecurity,
	Patch,
	Post,
	Query,
	Request,
	Route,
	Security,
	SuccessResponse,
} from '@tsoa/runtime';
import { IMatch, IMatchCreateDto, IMatchUpdateDto } from './interfaces/match';
import * as MatchService from './matchService';
import * as Match from './match';
import * as MatchMap from './matchMap';
import { IAuthResponse } from './auth';
import { IMatchMapUpdateDto } from './interfaces/matchMap';

@Route('/api/matches')
@Security('bearer_token')
export class MatchesController extends Controller {
	@Post()
	@SuccessResponse(201)
	@NoSecurity()
	async createMatch(@Body() requestBody: IMatchCreateDto): Promise<IMatch> {
		const match = await MatchService.create(requestBody);
		this.setHeader('Location', `/api/matches/${match.data.id}`);
		this.setStatus(201);
		return match.data;
	}

	@Get()
	async getAllMatches(
		@Request() { user }: { user: IAuthResponse },
		@Query('state') state?: string[],
		@Query('passthrough') passthrough?: string[],
		@Query('isStopped') isStopped?: boolean
	): Promise<IMatch[]> {
		const matches = await MatchService.getAll();
		return matches
			.filter((m) => state === undefined || state.includes(m.state))
			.filter(
				(m) =>
					passthrough === undefined ||
					(typeof m.passthrough === 'string' && passthrough.includes(m.passthrough))
			)
			.filter((m) => isStopped === undefined || m.isStopped === isStopped);
	}

	@Get('{id}')
	async getMatch(
		id: string,
		@Request() { user }: { user: IAuthResponse }
	): Promise<IMatch | void> {
		const match = MatchService.get(id);
		if (match) {
			return match.data;
		}

		const matchFromStorage = await MatchService.getFromStorage(id);
		if (matchFromStorage) {
			return matchFromStorage;
		}

		this.setStatus(404);
		return;
	}

	@Get('{id}/server/round_backups')
	async getRoundBackups(
		id: string,
		@Request() { user }: { user: IAuthResponse },
		@Query('count') count?: number
	): Promise<{ latestFiles: string[]; total: number } | void> {
		const match = MatchService.get(id);
		if (match) {
			return await Match.getRoundBackups(match, count);
		} else {
			this.setStatus(404);
			return;
		}
	}

	@Post('{id}/server/round_backups/{file}')
	async loadRoundBackup(
		id: string,
		file: string,
		@Request() { user }: { user: IAuthResponse }
	): Promise<boolean | void> {
		const match = MatchService.get(id);
		if (match) {
			if (await Match.loadRoundBackup(match, file)) {
				return true;
			} else {
				this.setStatus(400);
				return false;
			}
		} else {
			this.setStatus(404);
			return;
		}
	}

	@Patch('{id}')
	async updateMatch(
		id: string,
		@Body() requestBody: IMatchUpdateDto,
		@Request() { user }: { user: IAuthResponse }
	): Promise<void> {
		const match = MatchService.get(id);
		if (match) {
			await Match.update(match, requestBody);
		} else {
			this.setStatus(404);
		}
	}

	@Patch('{id}/matchMap/{mapNumber}')
	async updateMatchMap(
		id: string,
		mapNumber: number,
		@Body() requestBody: IMatchMapUpdateDto,
		@Request() { user }: { user: IAuthResponse }
	): Promise<void> {
		const match = MatchService.get(id);
		if (!match) {
			this.setStatus(404);
			return;
		}
		const matchMap = match.data.matchMaps[mapNumber];
		if (!matchMap) {
			this.setStatus(404);
			return;
		}
		await MatchMap.update(match, matchMap, requestBody);
	}

	@Delete('{id}')
	async deleteMatch(id: string, @Request() { user }: { user: IAuthResponse }): Promise<void> {
		if (await MatchService.remove(id)) {
			this.setStatus(200);
		} else {
			this.setStatus(404);
		}
	}

	@Patch('{id}/revive')
	async reviveMatch(id: string, @Request() { user }: { user: IAuthResponse }): Promise<void> {
		if (await MatchService.revive(id)) {
			this.setStatus(200);
		} else {
			this.setStatus(404);
		}
	}

	@NoSecurity()
	@Post('{id}/server/log/{secret}')
	receiveLog(id: string, secret: string, @Body() requestBody: any): void {
		const match = MatchService.get(id);
		if (match && match.data.logSecret === secret) {
			this.setStatus(200);
			// async, so game server does not have to wait for processing (it will resend data if it takes too long)
			Match.onLog(match, requestBody.raw).catch((err) => {
				// console.error(err);
				match.log(`error in Match.onLog(): ${err}`);
			});
		} else if (MatchService.isStartingMatch(id)) {
			// drop logs for matches in startup phase
			this.setStatus(200);
		} else {
			// 410 tells the cs go server to stop send logs
			console.info(`return 410 to game server (match id: ${id})`);
			this.setStatus(410);
		}
	}
}

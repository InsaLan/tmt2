import { Controller, Get, NoSecurity, Route, Request, Security, Post } from '@tsoa/runtime';
import { IAuthResponseOptional } from '../../common';
import * as Auth from './auth';

@Route('/api/auth')
export class AuthController extends Controller {
	/**
	 * Get the authentication type for a token.
	 */
	@Get()
	@NoSecurity()
	async getAuthType(
		@Request() req: Auth.ExpressRequest<IAuthResponseOptional>,
	): Promise<IAuthResponseOptional> {
		const token = req.get('authorization');
		if (!token) {
			return { type: 'UNAUTHORIZED' };
		}
		return Auth.getTokenType(token);
	}
}
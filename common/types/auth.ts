export interface IAuthResponse {
	type: 'GLOBAL' | 'MATCH';
	comment?: string;
}

export type IAuthResponseOptional =
	| IAuthResponse
	| {
			type: 'UNAUTHORIZED';
	  };
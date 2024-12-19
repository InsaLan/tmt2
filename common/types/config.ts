export interface IConfig {
	tmtLogAddress: string | null;
	allowUnregisteredMatchCreation: boolean;
}

export interface IConfigUpdateDto {
	tmtLogAddress?: string | null;
	allowUnregisteredMatchCreation?: boolean;
}

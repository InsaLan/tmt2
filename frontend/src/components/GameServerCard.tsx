import { Component } from 'solid-js';
import { IMatchResponse } from '../../../common';
import { SvgCopyAll, SvgOpenInNew } from '../assets/Icons';
import { t } from '../utils/locale';
import { Card } from './Card';

export const GameServerCard: Component<{
	match: IMatchResponse;
}> = (props) => {
	const ipPort = () => `${props.match.gameServer.ip}:${props.match.gameServer.port}`;
	const steamUrl = () => `steam://connect/${ipPort()}/${props.match.serverPassword}`;
	const command = () =>
		(props.match.serverPassword ? `password "${props.match.serverPassword}"; ` : '') +
		`connect ${ipPort()}`;
	return (
		<Card>
			<h2 class="text-lg font-bold">{t('Game Server')}</h2>
			<p>
				<a href={steamUrl()}>
					{steamUrl()} <SvgOpenInNew class="inline-block" />
				</a>
				<br />
				<span class="align-middle">{command()}</span>
				<button
					class="ml-1 align-middle"
					onClick={() => navigator.clipboard.writeText(command())}
				>
					<SvgCopyAll />
				</button>
			</p>
		</Card>
	);
};

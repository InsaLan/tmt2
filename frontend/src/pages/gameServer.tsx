import { useParams } from '@solidjs/router';
import { Component, createSignal, onMount } from 'solid-js';
import { GameServerCard } from '../components/GameServerCard';
import { RconServer } from '../components/Rcon';
import { createFetcher } from '../utils/fetcher';
import { t } from '../utils/locale';
import { addNotification } from '../stores/notifications';

export const GameServerPage: Component = () => {
	const params = useParams();
	const parts = params.ipPort.split(':', 2);
	const ip = parts[0];
	const port = Number.parseInt(parts[1]);
	const [serverPassword, setServerPassword] = createSignal('');
	const fetcher = createFetcher();

	onMount(() => {
		fetcher<string[]>('POST', `/api/gameservers/${ip}/${port}`, ['sv_password']).then(
			(response) => {
				const configVarPattern = new RegExp(`^sv_password = (.*)`);
				const configVarMatch = response?.[0]?.match(configVarPattern);
				if (configVarMatch) {
					setServerPassword(configVarMatch[1]);
				}
			}
		);
	});

	if (Number.isNaN(port)) {
		addNotification(t('IP: port invalid'), 'error');
	}

	return (
		<div class="space-y-5">
			<GameServerCard ipPort={ip + ':' + port} serverPassword={serverPassword()} />
			<RconServer ip={ip} port={port} />
		</div>
	);
};

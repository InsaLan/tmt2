import { Component, createEffect, createSignal, onMount } from "solid-js"
import { IConfig, IConfigUpdateDto } from "../../../common"
import { Card } from "./Card"
import { t } from "../utils/locale"
import { ToggleInput } from "./Inputs"
import { createFetcher } from "../utils/fetcher"

export const ConfigCard: Component = () => {
	const fetcher = createFetcher();
	const [config, setConfig] = createSignal<IConfig>();
	
	createEffect(() => {
		fetcher<IConfig>('GET', `/api/config`).then((c) => {
			setConfig(c);
		});
	});
	
	const update = async (dto: IConfigUpdateDto) => {
		const response = await fetcher<IConfig>(
			'PATCH',
			'/api/config',
			dto
		);
		if (response) {
			setConfig(response);
		}
	}
	
	return (
		<Card>
			<ToggleInput
				label={t('Allow Anyone to Create Matches')}
				checked={config()?.allowUnregisteredMatchCreation}
				onInput={(e) => {
					if (e.currentTarget.checked !== config()?.allowUnregisteredMatchCreation) {
						update({ allowUnregisteredMatchCreation: e.currentTarget.checked });
					}
				}}
			/>
		</Card>
	)
}
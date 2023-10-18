import autoAnimate from '@formkit/auto-animate';
import { useNavigate } from '@solidjs/router';
import { Component, createEffect, createSignal, For, Index, onMount, Show } from 'solid-js';
import {
	getOtherTeamAB,
	IElectionStep,
	IMatch,
	IMatchCreateDto,
	TMatchMode,
	TTeamAB,
} from '../../../common';
import { createFetcher } from '../utils/fetcher';
import { t } from '../utils/locale';
import { Card } from '../components/Card';
import { SelectInput, TextArea, TextInput, ToggleInput } from '../components/Inputs';
import { AddElectionStep, getElectionStepString } from '../components/ElectionStep';
import { Modal } from '../components/Modal';
import { createStore } from 'solid-js/store';
import { SvgAdd, SvgDelete, SvgKeyboardArrowDown, SvgKeyboardArrowUp } from '../assets/Icons';

const DEFAULT_MAPS = [
	'de_ancient',
	'de_anubis',
	'de_inferno',
	'de_mirage',
	'de_nuke',
	'de_overpass',
	'de_vertigo',
];

const getElectionStepsFromPreset = (preset: 'BO1' | 'BO3', mapPool: string[]): IElectionStep[] => {
	const electionSteps: IElectionStep[] = [];
	const mapPoolCount = mapPool.length;
	let currentTeam: TTeamAB = 'TEAM_A';
	let mapCount = 0;

	if (preset === 'BO1') {
		mapCount = 1;
	} else if (preset === 'BO3') {
		mapCount = 3;
	}

	const banCount = mapPoolCount - mapCount;

	if (banCount < 0) {
		throw 'map pool to small';
	}
	for (let i = 0; i < banCount; i++) {
		electionSteps.push({
			map: {
				mode: 'BAN',
				who: currentTeam,
			},
		});
		currentTeam = getOtherTeamAB(currentTeam);
	}
	for (let i = 0; i < mapCount; i++) {
		electionSteps.push({
			map: {
				mode: 'RANDOM_PICK',
			},
			side: {
				mode: 'KNIFE',
			},
		});
	}

	return electionSteps;
};

const minifyMapPool = (maps: string) => {
	return maps
		.trim()
		.split('\n')
		.map((l) => l.trim())
		.filter((l) => l.length > 0);
};

export const CreatePage: Component = () => {
	const navigate = useNavigate();
	const fetcher = createFetcher();

	let addElectionStepIndex = 0;
	let electionStepModalRef: HTMLDialogElement | undefined;
	let electionStepsRef: HTMLDivElement | undefined;
	const [json, setJson] = createSignal('');
	const [errorMessage, setErrorMessage] = createSignal('');
	const [matchCreateDto, setMatchCreateDto] = createStore<IMatchCreateDto>({
		teamA: {
			name: 'Team A',
			advantage: 0,
		},
		teamB: {
			name: 'Team B',
			advantage: 0,
		},
		gameServer: null,
		mapPool: DEFAULT_MAPS,
		electionSteps: getElectionStepsFromPreset('BO1', DEFAULT_MAPS),
		rconCommands: {
			init: [],
			knife: [],
			match: [],
			end: [],
		},
		matchEndAction: 'NONE',
		mode: 'SINGLE',
		tmtLogAddress: window.location.protocol + '//' + window.location.host,
	});

	const createMatch = async () => {
		try {
			const response = await fetcher<IMatch>('POST', '/api/matches', JSON.parse(json()));
			if (response?.id) {
				navigate(`/matches/${response.id}`);
			} else {
				setErrorMessage(response + '');
			}
		} catch (err) {
			setErrorMessage(err + '');
		}
	};

	createEffect(() => {
		try {
			setJson(JSON.stringify(matchCreateDto, undefined, 4));
		} catch (err) {
			setJson('ERROR!\n' + err);
		}
	});

	onMount(() => {
		if (electionStepsRef) {
			autoAnimate(electionStepsRef);
		}
	});

	return (
		<Card>
			<div class="prose pt-4">
				<h2>{t('Teams')}</h2>
			</div>
			<TextInput
				label={t('Team A Name')}
				value={matchCreateDto.teamA.name}
				onInput={(e) => setMatchCreateDto('teamA', 'name', e.currentTarget.value)}
			/>
			<TextInput
				label={t('Team A Advantage')}
				type="number"
				min={0}
				value={matchCreateDto.teamA.advantage ?? 0}
				onInput={(e) =>
					setMatchCreateDto('teamA', 'advantage', parseInt(e.currentTarget.value))
				}
			/>

			<TextInput
				label={t('Team B Name')}
				value={matchCreateDto.teamB.name}
				onInput={(e) => setMatchCreateDto('teamB', 'name', e.currentTarget.value)}
			/>

			<TextInput
				label={t('Team B Advantage')}
				type="number"
				min={0}
				value={matchCreateDto.teamB.advantage ?? 0}
				onInput={(e) =>
					setMatchCreateDto('teamB', 'advantage', parseInt(e.currentTarget.value))
				}
			/>

			<div class="prose pt-4">
				<h2>{t('Game Server')}</h2>
			</div>
			<ToggleInput
				label={t('Use Own Game Server')}
				checked={false}
				onInput={(e) =>
					e.currentTarget.checked
						? setMatchCreateDto('gameServer', {
								ip: '',
								port: 27015,
								rconPassword: '',
						  })
						: setMatchCreateDto('gameServer', null)
				}
			/>
			<TextInput
				label={t('Game Server IP Address')}
				value={matchCreateDto.gameServer?.ip ?? ''}
				disabled={matchCreateDto.gameServer === null}
				onInput={(e) => setMatchCreateDto('gameServer', 'ip', e.currentTarget.value)}
			/>
			<TextInput
				label={t('Game Server Port')}
				type="number"
				value={matchCreateDto.gameServer?.port ?? 27015}
				disabled={matchCreateDto.gameServer === null}
				onInput={(e) =>
					setMatchCreateDto('gameServer', 'port', parseInt(e.currentTarget.value))
				}
			/>

			<TextInput
				label={t('Game Server Rcon Password')}
				value={matchCreateDto.gameServer?.rconPassword ?? ''}
				disabled={matchCreateDto.gameServer === null}
				onInput={(e) =>
					setMatchCreateDto('gameServer', 'rconPassword', e.currentTarget.value)
				}
			/>

			<div class="prose pt-4 pb-2">
				<h2>{t('Map Pool')}</h2>
			</div>
			<TextArea
				value={DEFAULT_MAPS.join('\n')}
				onInput={(e) => setMatchCreateDto('mapPool', minifyMapPool(e.currentTarget.value))}
				rows="8"
			/>

			<div class="prose pt-4 pb-2">
				<h2>{t('Election Steps')}</h2>
			</div>
			<div class="flex items-baseline">
				<div class="pr-2">{t('Quick Load:')}</div>
				<div class="join">
					<button
						class="btn btn-sm join-item"
						onClick={() =>
							setMatchCreateDto(
								'electionSteps',
								getElectionStepsFromPreset('BO1', matchCreateDto.mapPool)
							)
						}
					>
						{t('Best of 1')}
					</button>
					<button
						class="btn btn-sm join-item"
						onClick={() =>
							setMatchCreateDto(
								'electionSteps',
								getElectionStepsFromPreset('BO3', matchCreateDto.mapPool)
							)
						}
					>
						{t('Best of 3')}
					</button>
					<button
						class="btn btn-sm join-item"
						onClick={() => setMatchCreateDto('electionSteps', [])}
					>
						{t('Empty')}
					</button>
				</div>
			</div>

			<div class="space-y-1 pt-4" ref={electionStepsRef}>
				<For each={matchCreateDto.electionSteps}>
					{(electionStep, index) => (
						<div class="flex items-center">
							<div class="join leading-none">
								<button
									class="btn btn-square btn-xs join-item"
									onClick={() => {
										const newSteps = matchCreateDto.electionSteps.filter(
											(step, stepIndex) => stepIndex !== index()
										);
										setMatchCreateDto('electionSteps', newSteps);
									}}
								>
									<SvgDelete />
								</button>
								<button
									class="btn btn-square btn-xs join-item"
									disabled={index() === 0}
									onClick={() => {
										const newSteps = [...matchCreateDto.electionSteps];
										newSteps.splice(index(), 1);
										newSteps.splice(index() - 1, 0, electionStep);
										setMatchCreateDto('electionSteps', newSteps);
									}}
								>
									<SvgKeyboardArrowUp />
								</button>
								<button
									class="btn btn-square btn-xs join-item"
									disabled={index() === matchCreateDto.electionSteps.length - 1}
									onclick={() => {
										const newSteps = [...matchCreateDto.electionSteps];
										newSteps.splice(index(), 1);
										newSteps.splice(index() + 1, 0, electionStep);
										setMatchCreateDto('electionSteps', newSteps);
									}}
								>
									<SvgKeyboardArrowDown />
								</button>
								<div class="tooltip" data-tip={t('Add new Step')}>
									<button
										class="btn btn-square btn-xs join-item"
										onClick={() => {
											addElectionStepIndex = index() + 1;
											electionStepModalRef?.showModal();
										}}
									>
										<SvgAdd />
									</button>
								</div>
							</div>
							<div class="pl-2 font-light">{getElectionStepString(electionStep)}</div>
						</div>
					)}
				</For>
			</div>
			<Show when={matchCreateDto.electionSteps.length === 0}>
				<button
					class="btn btn-square btn-xs join-item"
					onClick={() => {
						addElectionStepIndex = 1;
						electionStepModalRef?.showModal();
					}}
				>
					<SvgAdd />
				</button>
			</Show>
			<Modal ref={electionStepModalRef} class="bg-base-300">
				<AddElectionStep
					index={addElectionStepIndex}
					add={(step) => {
						const newSteps = [...matchCreateDto.electionSteps];
						newSteps.splice(addElectionStepIndex, 0, step);
						setMatchCreateDto('electionSteps', newSteps);
						electionStepModalRef?.close();
					}}
				/>
			</Modal>

			<div class="prose pt-4">
				<h2>{t('Advanced Settings')}</h2>
			</div>

			<SelectInput
				label={t('Mode')}
				labelBottomLeft={
					matchCreateDto.mode === 'SINGLE'
						? t('Single mode: stops when match is finished')
						: matchCreateDto.mode === 'LOOP'
						? t('Loop mode: starts again after match is finished')
						: false
				}
				onInput={(e) => setMatchCreateDto('mode', e.currentTarget.value as TMatchMode)}
			>
				<option value="SINGLE">{t('Single')}</option>
				<option value="LOOP">{t('Loop')}</option>
			</SelectInput>

			<TextArea
				label={t('Match Init Payload Data (JSON)')}
				rows="25"
				value={json()}
				onInput={(e) => setJson(e.currentTarget.value)}
				class="font-mono"
			/>

			<Show when={errorMessage()}>
				<div class="h-4"></div>
				<div class="alert alert-error">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 shrink-0 stroke-current"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span>{errorMessage()}</span>
				</div>
			</Show>

			<div class="pt-4 text-center">
				<button class="btn btn-primary" onClick={() => createMatch()}>
					{t('Create Match')}
				</button>
			</div>
		</Card>
	);
};

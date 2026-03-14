import { A } from '@solidjs/router';
import { Component, createEffect, createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import { t } from '../utils/locale';
import { TStatus } from '../../../common';
import { SvgArrowOutward } from '../assets/Icons';
import { TextInput } from './Inputs';

export const StatsTable: Component<{
	headers: string[];
	data: any[];
	columns: string[];
	sortable?: boolean[]; // Which columns are sortable
	float?: boolean[]; // Which columns should be displayed with two decimal places
	colorFunctions?: (undefined | ((value: any) => string))[];
	defaultSortColumn: string;
	defaultSortAsc?: boolean;
	status: TStatus;
	groupBy?: string;
	details?: (undefined | [string, string])[]; // Array of [url prefix, prop] tuples for detail links
}> = (props) => {
	const [uniqueGroups, setUniqueGroups] = createSignal<string[]>([]);
	const [sortedUniqueGroups, setSortedUniqueGroups] = createSignal<string[]>([]);
	const [sortColumn, setSortColumn] = createSignal(props.defaultSortColumn);
	const [sortAsc, setSortAsc] = createSignal(props.defaultSortAsc ?? true);
	const [sortedData, setSortedData] = createSignal<any[]>([]);
	const [filteredData, setFilteredData] = createSignal<any[]>([]);
	const [searchQuery, setSearchQuery] = createSignal('');
	const [sorted, setSorted] = createSignal(false);

	createEffect(() => {
		if (props.groupBy && props.columns.includes(props.groupBy)) {
			let ug = new Set<string>();
			for (const d of props.data) {
				ug.add(d[props.groupBy]);
			}
			setUniqueGroups(Array.from(ug));
		}
	});

	createEffect(() => {
		if (sortColumn() === props.groupBy) {
			setSortedUniqueGroups(
				[...uniqueGroups()].sort((a, b) => {
					if (a < b) return sortAsc() ? -1 : 1;
					if (a > b) return sortAsc() ? 1 : -1;
					return 0;
				})
			);
			setSortedData([...props.data]);
		} else {
			setSortedData(
				[...props.data].sort((a, b) => {
					const column =
						sortColumn()
							.split('|')
							.find((col) => props.columns.includes(col)) ||
						sortColumn().split('|')[0];
					if (a[column] < b[column]) return sortAsc() ? -1 : 1;
					if (a[column] > b[column]) return sortAsc() ? 1 : -1;
					return 0;
				})
			);
			setSortedUniqueGroups(uniqueGroups());
		}
		setSorted(true);
	});

	createEffect(() => {
		const data = sortedData();
		if (searchQuery() === '') {
			setFilteredData(data);
			return;
		}

		const lowerCaseQuery = searchQuery().toLowerCase();
		const filtered = data.filter((item) => {
			return Object.values(item).some((value) =>
				String(value).toLowerCase().includes(lowerCaseQuery)
			);
		});
		setFilteredData(filtered);
	});

	const detailsButton = (d: any, column: number, inline: boolean) => (
		<Show
			when={inline}
			fallback={
				<A
					href={props.details![column]![0] + d[props.details![column]![1]]}
					class="btn btn-outline btn-sm w-full"
				>
					{t('Details')}
				</A>
			}
		>
			<A
				class="align-middle btn btn-ghost btn-circle btn-xs"
				href={props.details![column]![0] + d[props.details![column]![1]]}
			>
				<SvgArrowOutward class="size-5" />
			</A>
		</Show>
	);

	const cell = (d: any, column: string) => {
		let result = '';
		const columnIndex = props.columns.indexOf(column);
		for (const key of column.split('|')) {
			if (key in d) {
				if (d[key] instanceof Date) {
					result += d[key].toLocaleString();
				} else if (props.float && typeof d[key] === 'number') {
					if (props.float[columnIndex]) result += d[key].toFixed(2);
					else result += d[key].toFixed(0);
				} else {
					result += d[key];
				}
			} else {
				result += key;
			}
		}

		const color = props.colorFunctions?.[columnIndex]?.(result as any);

		const details =
			props.details && props.details[columnIndex]
				? detailsButton(d, columnIndex, true)
				: null;

		// If this column is flagged as float and the result is a number-like string,
		// render it as two equal-width parts: left = integer (right-aligned), right = decimal (left-aligned)
		if (props.float && props.float[columnIndex] && !isNaN(Number(result))) {
			const parts = result.split('.');
			const intPart = parts[0] ?? '';
			const fracPart = parts[1] ?? '';
			return (
				<td style={color ? { color } : undefined}>
					<div class="grid grid-cols-[1fr_1fr] h-full items-center">
						<div class="text-right">{intPart}</div>
						<div class="text-left">{fracPart ? `.${fracPart}` : ''}</div>
					</div>
					{details && <div class="flex justify-end">{details}</div>}
				</td>
			);
		}

		return (
			<td class="wrap-break-word text-center" style={color ? { color } : undefined}>
				<div class={`flex items-center ${details ? 'justify-between' : 'justify-center'}`}>
					<span>{result}</span>
					{details}
				</div>
			</td>
		);
	};

	let scrollerEl: HTMLDivElement | undefined;
	let tableEl: HTMLTableElement | undefined;
	let fixedRowEl: HTMLTableRowElement | undefined;

	const realHeaderCells: HTMLTableCellElement[] = [];
	const fixedHeaderCells: HTMLTableCellElement[] = [];
	let ro: ResizeObserver | undefined;

	const syncFixedHeader = () => {
		if (!tableEl || !fixedRowEl) return;

		for (let i = 0; i < realHeaderCells.length; i++) {
			const src = realHeaderCells[i];
			const dst = fixedHeaderCells[i];
			if (!src || !dst) continue;

			const w = src.getBoundingClientRect().width;
			dst.style.width = `${w}px`;
			dst.style.minWidth = `${w}px`;
			dst.style.maxWidth = `${w}px`;
		}

		const rect = tableEl.getBoundingClientRect();
		fixedRowEl.style.left = `${rect.left}px`;
		fixedRowEl.style.width = `${rect.width}px`;
	};

	const updateFixedHeaderVisibility = () => {
		let navBar = document.querySelector('.navbar') as HTMLElement | null;

		if (!tableEl || !fixedRowEl || !navBar) return;

		const navBottom = navBar.getBoundingClientRect().bottom;
		const tableTop = tableEl?.getBoundingClientRect().top ?? 0;

		if (tableTop < navBottom) {
			fixedRowEl.classList.remove('hidden-header');
		} else {
			fixedRowEl.classList.add('hidden-header');
		}
	};

	onMount(() => {
		syncFixedHeader();

		window.addEventListener('resize', syncFixedHeader);
		scrollerEl?.addEventListener('scroll', syncFixedHeader, { passive: true });

		ro = new ResizeObserver(syncFixedHeader);
		if (tableEl) ro.observe(tableEl);

		updateFixedHeaderVisibility();
		window.addEventListener('scroll', updateFixedHeaderVisibility, { passive: true });
	});

	onCleanup(() => {
		window.removeEventListener('resize', syncFixedHeader);
		scrollerEl?.removeEventListener('scroll', syncFixedHeader);
		window.removeEventListener('scroll', updateFixedHeaderVisibility);
		ro?.disconnect();
	});

	createEffect(() => {
		sortColumn();
		sortAsc();
		queueMicrotask(syncFixedHeader);
	});

	return (
		<>
			<style>{`
			.hidden-header {
				opacity: 0;
			}
			
			.fixed-header {
				transition: opacity 0.2s;
			}
		`}</style>
			<div class="flex justify-end mb-1">
				<TextInput
					type="text"
					placeholder={t('Search...')}
					class="input input-sm w-full md:w-64"
					value={searchQuery()}
					onInput={(e) => setSearchQuery(e.currentTarget.value)}
				/>
			</div>
			<div class="overflow-x-auto" ref={scrollerEl}>
				<table class="table table-zebra" ref={tableEl}>
					<thead>
						<tr class="border-b border-gray-700">
							<For each={props.headers}>
								{(header, i) => (
									<th
										ref={(el) => (realHeaderCells[i()] = el)}
										class="text-center"
										onClick={
											(props.sortable?.[i()] ?? true)
												? () => {
														const column = props.columns[i()];
														setSortAsc(
															sortColumn() === column && sortAsc()
																? false
																: true
														);
														setSortColumn(column);
													}
												: undefined
										}
										style={{
											cursor:
												(props.sortable?.[i()] ?? true)
													? 'pointer'
													: 'default',
										}}
									>
										{header +
											(sortColumn() === props.columns[i()]
												? sortAsc()
													? ' ▴'
													: ' ▾'
												: '')}
									</th>
								)}
							</For>
						</tr>
						<tr
							ref={fixedRowEl}
							class="fixed z-20 top-16 border-0 bg-base-100 rounded-2xl fixed-header hidden-header"
						>
							<For each={props.headers}>
								{(header, i) => (
									<th
										ref={(el) => (fixedHeaderCells[i()] = el)}
										class="text-center"
										onClick={
											(props.sortable?.[i()] ?? true)
												? () => {
														const column = props.columns[i()];
														setSortAsc(
															sortColumn() === column && sortAsc()
																? false
																: true
														);
														setSortColumn(column);
													}
												: undefined
										}
										style={{
											cursor:
												(props.sortable?.[i()] ?? true)
													? 'pointer'
													: 'default',
										}}
									>
										{header +
											(sortColumn() === props.columns[i()]
												? sortAsc()
													? ' ▴'
													: ' ▾'
												: '')}
									</th>
								)}
							</For>
						</tr>
					</thead>
					<tbody>
						{props.groupBy && props.columns.includes(props.groupBy) ? (
							<For each={sortedUniqueGroups()}>
								{(group) => (
									<>
										{filteredData()
											.filter(
												(d) => props.groupBy && d[props.groupBy] === group
											)
											.map((d, index, a) => {
												let cl = '';
												if (index === a.length - 1)
													cl =
														'border-b border-gray-700 last:border-b-0 font-medium';
												else
													cl =
														'border-b border-gray-800 last:border-b-0 font-medium';
												return (
													<tr class={cl}>
														<For each={props.columns}>
															{(column) => {
																if (
																	column != props.groupBy ||
																	index === 0
																)
																	return cell(d, column);
																return <td></td>;
															}}
														</For>
														<Show
															when={
																props.details &&
																props.details.length >
																	props.columns.length
															}
														>
															{detailsButton(
																d,
																props.columns.length,
																false
															)}
														</Show>
													</tr>
												);
											})}
									</>
								)}
							</For>
						) : (
							<For each={filteredData()}>
								{(d) => (
									<tr class="border-b border-gray-800 last:border-b-0 font-medium">
										<For each={props.columns}>
											{(column) => cell(d, column)}
										</For>
										<Show
											when={
												props.details &&
												props.details.length === props.columns.length + 1
											}
										>
											<td class="w-24 p-2">
												{detailsButton(d, props.columns.length, false)}
											</td>
										</Show>
									</tr>
								)}
							</For>
						)}
					</tbody>
				</table>
			</div>

			{props.status === 'NOT_FOUND' && (
				<div class="p-4">
					<div class="flex justify-center items-center h-full p-4">
						<span class="text-error">{t('This data does not exist.')}</span>
					</div>
				</div>
			)}

			{props.status === 'ERROR' && (
				<div class="p-4">
					<div class="flex justify-center items-center h-full p-4">
						<span class="text-error">
							{t('There was an error while fetching this data.')}
						</span>
					</div>
				</div>
			)}

			{(props.status === 'LOADING' || !sorted()) && (
				<div class="p-4">
					<div class="flex justify-center items-center h-full p-4">
						<span class="text-gray-500">{t('Loading...')}</span>
					</div>
				</div>
			)}

			{props.status === 'OK' && sortedData().length === 0 && (
				<div class="p-4">
					<div class="flex justify-center items-center h-full p-4">
						<span class="text-gray-500">{t('No data')}</span>
					</div>
				</div>
			)}
		</>
	);
};

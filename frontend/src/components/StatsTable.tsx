import { A } from '@solidjs/router';
import { Component, createEffect, createSignal, For } from 'solid-js';
import { t } from '../utils/locale';
import { TStatus } from '../../../common';

export const StatsTable: Component<{
	headers: string[];
	data: any[];
	columns: string[];
	sortable?: boolean[];
	defaultSortColumn: string;
	defaultSortAsc?: boolean;
	status: TStatus;
	groupBy?: string;
	detailsPrefix?: string;
	detailsProp?: string;
}> = (props) => {
	const [uniqueGroups, setUniqueGroups] = createSignal<string[]>([]);
	const [sortedUniqueGroups, setSortedUniqueGroups] = createSignal<string[]>([]);
	const [sortColumn, setSortColumn] = createSignal(props.defaultSortColumn);
	const [sortAsc, setSortAsc] = createSignal(props.defaultSortAsc ?? true);
	const [sortedData, setSortedData] = createSignal<any[]>([]);
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
					if (a < b) {
						return sortAsc() ? -1 : 1;
					}
					if (a > b) {
						return sortAsc() ? 1 : -1;
					}
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
					if (a[column] < b[column]) {
						return sortAsc() ? -1 : 1;
					}
					if (a[column] > b[column]) {
						return sortAsc() ? 1 : -1;
					}
					return 0;
				})
			);
			setSortedUniqueGroups(uniqueGroups());
		}
		setSorted(true);
	});

	const cell = (d: any, column: string) => {
		let result = '';
		for (const key of column.split('|')) {
			if (key in d) {
				if (d[key] instanceof Date) {
					result += d[key].toLocaleString('fr-FR');
				} else {
					result += d[key];
				}
			} else {
				result += key;
			}
		}
		return <td>{result}</td>;
	};

	const detailsButton = (d: any) => (
		<td class="w-24 p-2">
			<A
				href={props.detailsPrefix + d[props.detailsProp ? props.detailsProp : '']}
				class="btn btn-outline btn-sm w-full hover:no-underline"
			>
				{t('Details')}
			</A>
		</td>
	);

	return (
		<>
			<table class="table table-fixed">
				<thead>
					<tr class="border-b border-gray-700">
						<For each={props.headers}>
							{(header, i) => (
								<th
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
											(props.sortable?.[i()] ?? true) ? 'pointer' : 'default',
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
									{sortedData()
										.filter((d) => props.groupBy && d[props.groupBy] === group)
										.map((d, index, a) => {
											let cl = '';
											if (index === a.length - 1) {
												cl = 'border-b border-gray-700 last:border-b-0';
											} else {
												cl = 'border-b border-gray-800 last:border-b-0';
											}
											return (
												<tr class={cl}>
													<For each={props.columns}>
														{(column) => {
															if (
																column != props.groupBy ||
																index === 0
															) {
																return cell(d, column);
															}
															return <td></td>;
														}}
													</For>
													{props.detailsPrefix && detailsButton(d)}
												</tr>
											);
										})}
								</>
							)}
						</For>
					) : (
						<For each={sortedData()}>
							{(d) => (
								<tr class="border-b border-gray-800 last:border-b-0">
									<For each={props.columns}>{(column) => cell(d, column)}</For>
									{props.detailsPrefix && detailsButton(d)}
								</tr>
							)}
						</For>
					)}
				</tbody>
			</table>
			{props.status === 'NOT_FOUND' && (
				<div class="p-4">
					<div class="flex justify-center items-center h-full p-4">
						<span class="text-red-500">{t('This data does not exist.')}</span>
					</div>
				</div>
			)}
			{props.status === 'ERROR' && (
				<div class="p-4">
					<div class="flex justify-center items-center h-full p-4">
						<span class="text-red-500">
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
		</>
	);
};

import { Component, ComponentProps, JSXElement, Show, splitProps } from 'solid-js';

export const CheckboxInput: Component<
	ComponentProps<'input'> & {
		label?: string;
		labelTopRight?: string;
	}
> = (props) => {
	const [local, others] = splitProps(props, ['label', 'class', 'labelTopRight']);
	return (
		<div>
			<label class="label whitespace-normal wrap-break-word">
				<input type="checkbox" class={(local.class ?? '') + ' checkbox'} {...others} />
				{local.label}
			</label>
		</div>
	);
};

export const TextInput: Component<
	ComponentProps<'input'> & {
		label?: string;
		labelTopRight?: string;
		containerClass?: string;
	}
> = (props) => {
	const [local, others] = splitProps(props, [
		'label',
		'class',
		'containerClass',
		'labelTopRight',
	]);
	return (
		<div class={local.containerClass}>
			<label>
				<div
					class={
						'flex flex-col md:flex-row pb-0.5' +
						(local.label || local.labelTopRight ? '' : ' hidden')
					}
				>
					<span class="label grow whitespace-normal wrap-break-word">{local.label}</span>
					<span class="label whitespace-normal wrap-break-word">
						{local.labelTopRight}
					</span>
				</div>
				<input
					class={(local.class ?? '') + ' input w-full focus:outline-none border-2'}
					type="text"
					{...others}
				/>
			</label>
		</div>
	);
};

export const TextArea: Component<
	ComponentProps<'textarea'> & {
		label?: string;
		labelTopRight?: string;
	}
> = (props) => {
	const [local, others] = splitProps(props, ['label', 'class', 'labelTopRight']);
	return (
		<div>
			<label>
				<div
					class={
						'flex flex-col md:flex-row pb-0.5' +
						(local.label || local.labelTopRight ? '' : ' hidden')
					}
				>
					<span class="label grow whitespace-normal wrap-break-word">{local.label}</span>
					<span class="label whitespace-normal wrap-break-word">
						{local.labelTopRight}
					</span>
				</div>
				<textarea
					{...others}
					class={
						(local.class ?? '') +
						' textarea w-full focus:outline-none overflow-x-auto whitespace-pre'
					}
				></textarea>
			</label>
		</div>
	);
};

export const SelectInput: Component<
	ComponentProps<'select'> & {
		label?: string;
		labelTopRight?: string;
		labelBottomLeft?: JSXElement;
		children: JSXElement;
	}
> = (props) => {
	const [local, others] = splitProps(props, [
		'label',
		'labelBottomLeft',
		'class',
		'children',
		'labelTopRight',
	]);
	return (
		<div>
			<label>
				<div
					class={
						'flex flex-col md:flex-row pb-0.5' +
						(local.label || local.labelTopRight ? '' : ' hidden')
					}
				>
					<span class="label grow whitespace-normal wrap-break-word">{local.label}</span>
					<span class="label whitespace-normal wrap-break-word">
						{local.labelTopRight}
					</span>
				</div>
				<select
					class={(local.class ?? '') + ' select w-full focus:outline-none border-2'}
					{...others}
				>
					{local.children}
				</select>
				<div class={'flex' + (local.labelBottomLeft ? ' mt-2' : '')}>
					<span class="label grow whitespace-normal wrap-break-word">
						{local.labelBottomLeft}
					</span>
				</div>
			</label>
		</div>
	);
};

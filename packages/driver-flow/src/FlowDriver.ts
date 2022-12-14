import { Driver, Execution } from '@beemo/core';
import { FlowConfig, LintsConfig, OptionsConfig } from './types';

// Success: Writes "Found 0 errors" to stdout and server output to stderr
// Failure: Writes file list to stdout and server output to stderr
export class FlowDriver extends Driver<FlowConfig> {
	override readonly name = '@beemo/driver-flow';

	override bootstrap() {
		this.setMetadata({
			bin: 'flow',
			configName: '.flowconfig',
			description: this.tool.msg('app:flowDescription'),
			title: 'Flow',
			// watchOptions: ['server'],
		});
	}

	override formatConfig(data: FlowConfig): string {
		const output: string[] = [];

		Object.keys(data).forEach((key) => {
			const value = data[key as keyof FlowConfig];

			if (!value) {
				return;
			}

			output.push(`[${key}]`);

			switch (key) {
				case 'lints':
					output.push(...this.formatLintsSection(value as LintsConfig));
					break;
				case 'options':
					output.push(...this.formatOptionsSection(value as OptionsConfig));
					break;
				default:
					if (Array.isArray(value)) {
						output.push(...value.map((v) => String(v)));
					} else if (value) {
						output.push(String(value));
					}
					break;
			}

			output.push('');
		});

		return output.join('\n');
	}

	formatLintsSection(lints: LintsConfig): string[] {
		const output: string[] = [];

		Object.keys(lints).forEach((key) => {
			let value = lints[key];

			switch (value) {
				case 0:
				case 'off': {
					value = 'off';

					break;
				}
				case 1:
				case 'warn': {
					value = 'warn';

					break;
				}
				case 2:
				case 'error': {
					value = 'error';

					break;
				}
				// no default
			}

			output.push(`${key.replace(/_/gu, '-')}=${String(value)}`);
		});

		return output;
	}

	formatOption(value: unknown, quote: boolean = false): string {
		let option = value;

		// http://caml.inria.fr/pub/docs/manual-ocaml/libref/Str.html#TYPEregexp
		option =
			value instanceof RegExp
				? value.source.replace(/\|/gu, '\\|').replace(/\(/gu, '\\(').replace(/\)/gu, '\\)')
				: String(value);

		return quote ? `'${option}'` : String(option);
	}

	formatOptionsSection(options: OptionsConfig): string[] {
		const output: string[] = [];

		Object.keys(options).forEach((key) => {
			const value = options[key as keyof OptionsConfig];

			if (!value) {
				return;
			}

			// Multiple values
			if (Array.isArray(value)) {
				value.forEach((val) => {
					output.push(`${key}=${this.formatOption(val)}`);
				});

				// Mapped objects
			} else if (typeof value === 'object' && !(value instanceof RegExp)) {
				Object.keys(value).forEach((pattern) => {
					output.push(
						`${key}=${this.formatOption(pattern, true)} -> ${this.formatOption(
							value[pattern],
							true,
						)}`,
					);
				});

				// Primitives
			} else {
				output.push(`${key}=${this.formatOption(value)}`);
			}
		});

		return output;
	}

	// https://github.com/facebook/flow/blob/e466b0ee519622a8977e89708be156a73e570ef0/hack/utils/exit_status.ml#L78
	// https://github.com/facebook/flow/blob/e466b0ee519622a8977e89708be156a73e570ef0/src/common/flowExitStatus.ml#L54
	override processFailure(error: Execution) {
		if (error.exitCode === 2) {
			this.setOutput('stderr', error.stdout); // Command failures
		} else {
			super.processFailure(error);
		}
	}
}

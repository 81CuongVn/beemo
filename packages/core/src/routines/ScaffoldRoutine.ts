/* eslint-disable no-console, @typescript-eslint/member-ordering */

import { engine, Logger } from 'hygen';
import { Bind, Blueprint, instanceOf, Schemas } from '@boost/common';
import { color } from '@boost/internal';
import { Routine } from '@boost/pipeline';
import { ScaffoldContext } from '../contexts/ScaffoldContext';
import type { Tool } from '../Tool';
import { RoutineOptions } from '../types';

export class ScaffoldRoutine extends Routine<unknown, unknown, RoutineOptions> {
	blueprint({ instance }: Schemas): Blueprint<RoutineOptions> {
		return {
			tool: instance<Tool>().required().notNullable(),
		};
	}

	async execute(context: ScaffoldContext) {
		return this.createWaterfallPipeline(context)
			.pipe(this.options.tool.msg('app:scaffoldRunGenerator'), this.runGenerator)
			.run();
	}

	/**
	 * Execute the hygen scaffolding generator.
	 */
	@Bind()
	async runGenerator(context: ScaffoldContext) {
		const { tool } = this.options;
		const args = [context.generator, context.action];
		const templates = tool.getConfigModuleRoot().append('templates').path();

		this.debug(
			'Scaffolding %s:%s templates from %s',
			color.symbol(context.generator),
			color.symbol(context.action),
			color.filePath(templates),
		);

		try {
			await engine(args, {
				createPrompter: this.handlePrompter,
				cwd: tool.cwd.path(),
				debug: tool.config.debug,
				// eslint-disable-next-line @typescript-eslint/no-misused-promises
				exec: this.handleExec,
				logger: new Logger(console.log),
				templates,
			});
		} catch (error: unknown) {
			// Intercept hygen error to provide a better error message
			if (instanceOf(error, Error) && error.message.startsWith("I can't find action")) {
				throw new Error(tool.msg('errors:scaffoldNoTemplates', { path: args.join('/') }));
			}

			throw error;
		}
	}

	/**
	 * Handle shell executions from hygen.
	 */
	private handleExec = async (action: string, input: string) => {
		await this.executeCommand(action, [], {
			input,
			preferLocal: true,
			shell: true,
		});
	};

	/**
	 * Temporary solution until boost supports prompts.
	 */
	// istanbul ignore next
	private handlePrompter = () => ({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		prompt: () => Promise.resolve({ overwrite: true } as any),
	});
}

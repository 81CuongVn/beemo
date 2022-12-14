/* eslint-disable no-param-reassign */

import rimraf from 'rimraf';
import { Blueprint, ConfigContext, Driver, DriverContext, Path, Schemas } from '@beemo/core';
import { Event } from '@boost/event';
import { syncProjectRefs } from './commands/syncProjectRefs';
import { join, writeFile } from './helpers';
import { TypeScriptConfig, TypeScriptOptions } from './types';

// Success: Writes nothing to stdout or stderr
// Failure: Writes to stdout on syntax and type error
export class TypeScriptDriver extends Driver<TypeScriptConfig, TypeScriptOptions> {
	override readonly name = '@beemo/driver-typescript';

	readonly onCreateProjectConfigFile = new Event<[Path, TypeScriptConfig, boolean]>(
		'create-project-config-file',
	);

	override blueprint(schemas: Schemas): Blueprint<TypeScriptOptions> {
		const { array, bool, string } = schemas;

		return {
			...super.blueprint(schemas),
			buildFolder: string('lib'),
			declarationOnly: bool(),
			devFolders: array().of(string()),
			globalTypes: bool(true),
			localTypes: bool(true),
			srcFolder: string('src'),
			testsFolder: string('tests'),
			typesFolder: string('types'),
		};
	}

	override bootstrap() {
		this.setMetadata({
			bin: 'tsc',
			commandOptions: {
				clean: {
					default: false,
					description: this.tool.msg('app:typescriptCleanOption'),
					type: 'boolean',
				},
			},
			configName: 'tsconfig.json',
			configOption: '',
			description: this.tool.msg('app:typescriptDescription'),
			helpOption: '--help --all',
			title: 'TypeScript',
			watchOptions: ['-w', '--watch'],
			workspaceStrategy: 'copy',
		});

		this.registerCommand(
			'sync-project-refs',
			{ description: this.tool.msg('app:typescriptSyncProjectRefsDescription') },
			syncProjectRefs,
		);

		this.onCreateConfigFile.listen(this.handlePrepareConfigs);
		this.onBeforeExecute.listen(this.handleCleanTarget);
	}

	/**
	 * Automatically clean the target folder if `outDir` and `--clean` is used.
	 */
	handleCleanTarget = (context: DriverContext) => {
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		const outDir = context.getRiskyOption('outDir', true) || this.config.compilerOptions?.outDir;

		if (context.getRiskyOption('clean') && typeof outDir === 'string' && outDir) {
			rimraf.sync(Path.resolve(outDir).path());
		}

		return Promise.resolve();
	};

	/**
	 * Extract compiler options from the root config into a separate config purely for
	 * extending options. Update the root config with references to all workspaces.
	 */
	handlePrepareConfigs = (context: ConfigContext, configPath: Path, config: TypeScriptConfig) => {
		const { tool } = this;
		const { devFolders = [], srcFolder, testsFolder } = this.options;
		const workspacePackages = tool.project.getWorkspacePackages();

		if (workspacePackages.length === 0) {
			return;
		}

		// Extract compiler optionst to a separate config
		const optionsConfigPath = configPath.parent().append('tsconfig.options.json');

		void writeFile(optionsConfigPath, {
			compilerOptions: {
				...config.compilerOptions,
				composite: true,
				declaration: true,
				declarationMap: true,
				outDir: undefined,
				outFile: undefined,
			},
		});

		// Delete problematic root options
		delete config.compilerOptions;
		delete config.include;
		delete config.exclude;

		// Generate references and update paths
		config.extends = './tsconfig.options.json';
		config.files = [];
		config.references ||= [];

		workspacePackages.forEach(({ metadata }) => {
			const pkgPath = new Path(metadata.packagePath);
			const refPaths: Path[] = [];

			if (srcFolder && pkgPath.append(srcFolder).exists()) {
				refPaths.push(pkgPath);
			}

			if (testsFolder && pkgPath.append(testsFolder).exists()) {
				refPaths.push(pkgPath.append(testsFolder));
			}

			devFolders.forEach((devFolder) => {
				if (devFolder && pkgPath.append(devFolder).exists()) {
					refPaths.push(pkgPath.append(devFolder));
				}
			});

			refPaths.forEach((refPath) => {
				config.references!.push({
					path: join(tool.project.root.relativeTo(refPath)),
				});
			});
		});

		// Add to context so that it can be automatically cleaned up
		context.addConfigPath('typescript', optionsConfigPath);
	};
}

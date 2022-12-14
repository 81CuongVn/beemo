import { mockTool } from '@beemo/core/test';
import factory from '../src';
import { LernaDriver } from '../src/LernaDriver';

describe('LernaDriver', () => {
	let driver: LernaDriver;

	beforeEach(() => {
		driver = new LernaDriver();
		driver.startup(mockTool());
	});

	it('index returns a driver instance', () => {
		expect(factory()).toBeInstanceOf(LernaDriver);
	});

	it('can pass options through factory', () => {
		driver = factory({ args: ['--foo'] });

		expect(driver.options).toEqual(
			expect.objectContaining({
				args: ['--foo'],
			}),
		);
	});

	it('sets options from constructor', () => {
		driver = new LernaDriver({
			args: ['--foo', '--bar=1'],
			dependencies: ['babel'],
			env: { DEV: 'true' },
		});

		expect(driver.options).toEqual({
			args: ['--foo', '--bar=1'],
			configStrategy: 'native',
			dependencies: ['babel'],
			env: { DEV: 'true' },
			expandGlobs: true,
			outputStrategy: 'buffer',
			template: '',
		});
	});

	it('sets correct metadata', () => {
		expect(driver.metadata).toEqual(
			expect.objectContaining({
				bin: 'lerna',
				configName: 'lerna.json',
				configOption: '--config',
				dependencies: [],
				description: 'Manage monorepos with Lerna',
				filterOptions: false,
				helpOption: '--help',
				title: 'Lerna',
				useConfigOption: false,
			}),
		);
	});
});

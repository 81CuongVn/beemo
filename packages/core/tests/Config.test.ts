import { Config } from '../src/Config';

describe('Config', () => {
	let config: Config;

	beforeEach(() => {
		config = new Config('beemo');
	});

	it('errors if no module', () => {
		expect(() => {
			config.configure({ module: '' });
		}).toThrowErrorMatchingSnapshot();
	});

	it('doesnt error if module is defined with env var', () => {
		process.env.BEEMO_CONFIG_MODULE = 'test-boost';

		let opts: { module?: string } = {};

		expect(() => {
			opts = new Config('beemo').options;
		}).not.toThrow();

		expect(opts.module).toBe('test-boost');

		process.env.BEEMO_CONFIG_MODULE = '';
	});
});

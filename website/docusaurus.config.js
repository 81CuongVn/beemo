/* eslint-disable sort-keys */

const path = require('path');

const pkgNames = [
	'cli',
	'core',
	'driver-babel',
	'driver-eslint',
	'driver-flow',
	'driver-jest',
	'driver-lerna',
	'driver-mocha',
	'driver-prettier',
	'driver-rollup',
	'driver-stylelint',
	'driver-typescript',
	'driver-webpack',
];

// eslint-disable-next-line
const pkgs = pkgNames.map((name) => require(`../packages/${name}/package.json`));

module.exports = {
	title: 'Beemo',
	tagline:
		'Manage developer and build tools, their configuration, and common commands in a single centralized repository.',
	url: 'https://beemo.dev',
	baseUrl: '/',
	onBrokenLinks: 'throw',
	onDuplicateRoutes: 'throw',
	favicon: 'img/favicon.svg',
	organizationName: 'beemojs',
	projectName: 'beemo',
	themeConfig: {
		algolia: {
			apiKey: '1b170ddbd51334e7ff1ae04a4a3c8cfc',
			appId: 'CVDU6RRKBY',
			indexName: 'beemo',
		},
		navbar: {
			title: 'Beemo',
			logo: {
				alt: 'Beemo',
				src: 'img/logo.svg',
			},
			items: [
				{
					label: 'v2',
					position: 'left',
					items: pkgs.map((pkg) => ({
						label: `v${pkg.version} · ${pkg.name.split('/')[1]}`,
						href: `https://www.npmjs.com/package/${pkg.name}`,
					})),
				},
				{
					to: 'docs',
					activeBasePath: 'docs',
					label: 'Docs',
					position: 'left',
				},
				{
					to: 'api',
					label: 'API',
					position: 'left',
				},
				{
					href: 'https://github.com/beemojs/beemo',
					label: 'GitHub',
					position: 'right',
				},
			],
		},
		footer: {
			style: 'dark',
			links: [],
			copyright: `Copyright © ${new Date().getFullYear()} Miles Johnson. Built with <a href="https://docusaurus.io/">Docusaurus</a>. Icon by <a href="https://thenounproject.com/search/?q=settings&i=2473984">Alice Design</a>.`,
		},
	},
	presets: [
		[
			'@docusaurus/preset-classic',
			{
				docs: {
					sidebarPath: require.resolve('./sidebars.js'),
					editUrl: 'https://github.com/beemojs/beemo/edit/master/website/',
				},
				blog: {
					showReadingTime: true,
					editUrl: 'https://github.com/beemojs/beemo/edit/master/website/blog/',
				},
				theme: {
					customCss: require.resolve('./src/css/custom.css'),
				},
			},
		],
	],
	plugins: [
		[
			'docusaurus-plugin-typedoc-api',
			{
				projectRoot: path.join(__dirname, '..'),
				packages: pkgNames.map((pkgName) => `packages/${pkgName}`),
				minimal: true,
			},
		],
	],
};

# 🤖 Beemo

[![Build Status](https://github.com/beemojs/beemo/workflows/Build/badge.svg)](https://github.com/beemojs/beemo/actions?query=branch%3Amaster)
[![npm version](https://badge.fury.io/js/%40beemo%2Fcore.svg)](https://www.npmjs.com/package/@beemo/core)
[![npm deps](https://david-dm.org/beemojs/beemo.svg?path=packages/core)](https://www.npmjs.com/package/@beemo/core)

> # Beemo is no longer in development and will not be maintained or upgraded! We suggest migrating to a more thorough solution, like [moon](https://moonrepo.dev), a Rust based build system.

Manage dev and build tools, their configuration, and commands in a single centralized repository.
Beemo aims to solve the multi-project maintenance fatigue by removing the following burdens across
all projects: config and dotfile management, multiple config patterns, up-to-date development
dependencies, continuous copy and paste, and more.

## Features

- Manage dev tools and configurations in a single repository.
- Configure supported dev tools using `.js` or `.ts` files.
- Customize and alter config at runtime with CLI options.
- Pass custom CLI options to dev tool commands without failure.
- Automatically expand glob patterns (a better alternative to bash).
- Listen to and act upon events.
- Easily share config between dev tools.
- Avoid relative config or `extends` paths.
- Automatic config file cleanup.
- Custom scripts with CLI options.
- Scaffolding and template generation.
- Workspaces (monorepo) support.
- Automated TypeScript project references.
- Parallel, pooled, and prioritized builds.
- Integrated watch/live mode.
- And much more.

## Requirements

- Node 12.17+
- GitHub, Bitbucket, or another VCS

## Documentation

[https://beemo.dev](https://beemo.dev)

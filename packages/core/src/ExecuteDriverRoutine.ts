/**
 * @copyright   2017, Miles Johnson
 * @license     https://opensource.org/licenses/MIT
 */

import fs from 'fs-extra';
import path from 'path';
import glob from 'glob';
import trim from 'lodash/trim';
import { Routine, RoutineInterface, PackageConfig } from 'boost';
import DriverContext from './contexts/DriverContext';
import RunCommandRoutine, { RunCommandOptions } from './driver/RunCommandRoutine';
import isPatternMatch from './utils/isPatternMatch';
import { BeemoConfig } from './types';

export default class ExecuteDriverRoutine extends Routine<BeemoConfig, DriverContext> {
  workspacePackages: PackageConfig[] = [];

  bootstrap() {
    const { args, primaryDriver, workspaces } = this.context;

    if (args.workspaces) {
      if (!workspaces || workspaces.length === 0) {
        throw new Error(
          `Option --workspaces=${args.workspaces} provided but project is not workspaces enabled.`,
        );
      }

      this.workspacePackages = this.loadWorkspacePackages();

      this.getFilteredWorkspaces().forEach(pkg => {
        this.pipeParallelBuilds(pkg.workspaceName, {
          forceConfigOption: true,
          workspaceRoot: pkg.workspacePath,
        });
      });
    } else {
      this.pipeParallelBuilds(primaryDriver.name);
    }
  }

  execute(context: DriverContext): Promise<string[]> {
    const { other, priority } = this.orderByWorkspacePriorityGraph();

    return this.serializeRoutines(null, priority).then(() =>
      this.poolRoutines(
        null,
        {
          concurrency: context.args.concurrency,
        },
        other,
      ).then(response => {
        if (response.errors.length > 0) {
          const messages = response.errors.map(error => error.message);

          throw new Error(`Execution failure.\n${messages.join('\n\n')}`);
        }

        return response.results;
      }),
    );
  }

  /**
   * Return a list of workspaces optionally filtered.
   */
  getFilteredWorkspaces(): PackageConfig[] {
    return this.workspacePackages.filter(pkg =>
      // @ts-ignore Contains not typed yet.
      isPatternMatch(pkg.name, this.context.args.workspaces, { contains: true }),
    );
  }

  /**
   * Load package.json from each workspace package.
   */
  loadWorkspacePackages(): PackageConfig[] {
    return glob
      .sync(`${this.context.workspaces}/package.json`, {
        absolute: true,
        cwd: this.context.root,
        debug: this.tool.config.debug,
        strict: true,
      })
      .map(filePath => {
        const pkg = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        pkg.packagePath = filePath;
        pkg.workspacePath = path.dirname(filePath);
        pkg.workspaceName = path.basename(pkg.workspacePath);

        return pkg;
      });
  }

  /**
   * Group routines in order of which they are dependend on.
   */
  orderByWorkspacePriorityGraph(): {
    other: RoutineInterface[];
    priority: RoutineInterface[];
  } {
    if (!this.context.args.priority) {
      return {
        other: this.routines,
        priority: [],
      };
    }

    // Create a mapping of package names within all workspaces
    const packages: { [name: string]: PackageConfig } = {};

    this.workspacePackages.forEach(pkg => {
      packages[pkg.name] = pkg;
    });

    // Determine dependend on packages by resolving the graph and incrementing counts
    const depCounts: { [name: string]: { count: number; package: PackageConfig } } = {};

    this.workspacePackages.forEach(pkg => {
      const deps = {
        ...pkg.dependencies,
        ...pkg.peerDependencies,
      };

      Object.keys(deps).forEach(depName => {
        if (!packages[depName]) {
          return;
        }

        if (depCounts[depName]) {
          depCounts[depName].count += 1;
        } else {
          depCounts[depName] = {
            count: 1,
            package: packages[depName],
          };
        }
      });
    });

    // Order by highest count
    const orderedDeps = Object.values(depCounts)
      .sort((a, b) => b.count - a.count)
      .map(dep => dep.package);

    // Extract dependents in order
    const priority: RoutineInterface[] = [];

    orderedDeps.forEach(pkg => {
      const routine = this.routines.find(route => route.key === pkg.workspaceName);

      if (routine) {
        priority.push(routine);
      }
    });

    // Extract dependers
    const other: RoutineInterface[] = [];

    this.routines.forEach(routine => {
      const dependency = orderedDeps.find(dep => dep.workspaceName === routine.key);

      if (!dependency) {
        other.push(routine);
      }
    });

    return {
      other,
      priority,
    };
  }

  /**
   * When a --parallel option is defined, we need to create an additional routine for each instance.
   */
  pipeParallelBuilds(key: string, options: Partial<RunCommandOptions> = {}) {
    const { args, argv, primaryDriver } = this.context;
    const filteredArgv = argv.filter(arg => !arg.includes('--parallel'));
    const command = `${primaryDriver.metadata.bin} ${filteredArgv.join(' ')}`;

    if (Array.isArray(args.parallel) && args.parallel.length > 0) {
      args.parallel.forEach(pargv => {
        const trimmedPargv = trim(pargv, '"').trim();

        this.pipe(
          new RunCommandRoutine(key, `${command} ${trimmedPargv}`, {
            ...options,
            additionalArgv: trimmedPargv.split(/ /g),
          }),
        );
      });
    } else {
      this.pipe(new RunCommandRoutine(key, command, options));
    }
  }
}

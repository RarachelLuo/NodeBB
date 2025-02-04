import * as fs from 'fs';
import * as childProcess from 'child_process';
import * as chalk from 'chalk';

import fork from '../meta/debugFork';
import { paths } from '../constants';

const cwd = paths.baseDir;

function getRunningPid(callback: (err: NodeJS.ErrnoException | null, pidNum?: number) => void) {
    fs.readFile(paths.pidfile, {
        encoding: 'utf-8',
    }, (err, pid) => {
        if (err) {
            return callback(err);
        }

        const pidNum = parseInt(pid, 10);

        try {
            process.kill(pidNum, 0);
            callback(null, pidNum);
        } catch (e) {
            if (e instanceof Error) {
                callback(e);
            } else {
                console.log('An unexpected error occurred.');
            }
        }
    });
}

function start(options: { dev?: boolean; log?: boolean; silent?: boolean }) {
    if (options.dev) {
        process.env.NODE_ENV = 'development';
        fork(paths.loader, ['--no-daemon', '--no-silent'], {
            env: process.env,
            stdio: 'inherit',
            cwd,
        });
        return;
    }
    if (options.log) {
        console.log(`\n${[
            chalk.bold('Starting NodeBB with logging output'),
            chalk.red('Hit ') + chalk.bold('Ctrl-C ') + chalk.red('to exit'),
            'The NodeBB process will continue to run in the background',
            `Use "${chalk.yellow('./nodebb stop')}" to stop the NodeBB server`,
        ].join('\n')}`);
    } else if (!options.silent) {
        console.log(`\n${[
            chalk.bold('Starting NodeBB'),
            `  "${chalk.yellow('./nodebb stop')}" to stop the NodeBB server`,
            `  "${chalk.yellow('./nodebb log')}" to view server output`,
            `  "${chalk.yellow('./nodebb help')}" for more commands\n`,
        ].join('\n')}`);
    }

    // Spawn a new NodeBB process
    const child = fork(paths.loader, process.argv.slice(3), {
        env: process.env,
        cwd,
    });
    if (options.log) {
        childProcess.spawn('tail', ['-F', './logs/output.log'], {
            stdio: 'inherit',
            cwd,
        });
    }

    return child;
}

function stop() {
    getRunningPid((err, pid) => {
        if (!err) {
            process.kill(pid, 'SIGTERM');
            console.log('Stopping NodeBB. Goodbye!');
        } else {
            console.log('NodeBB is already stopped.');
        }
    });
}

function restart(options: { silent?: boolean }) {
    getRunningPid((err, pid) => {
        if (!err) {
            console.log(chalk.bold('\nRestarting NodeBB'));
            process.kill(pid, 'SIGTERM');

            options.silent = true;
            start(options);
        } else {
            console.warn('NodeBB could not be restarted, as a running instance could not be found.');
        }
    });
}

function status() {
    getRunningPid((err, pid) => {
        if (!err) {
            console.log(`\n${[
                chalk.bold('NodeBB Running ') + chalk.cyan(`(pid ${pid?.toString()})`),
                `\t"${chalk.yellow('./nodebb stop')}" to stop the NodeBB server`,
                `\t"${chalk.yellow('./nodebb log')}" to view server output`,
                `\t"${chalk.yellow('./nodebb restart')}" to restart NodeBB\n`,
            ].join('\n')}`);
        } else {
            console.log(chalk.bold('\nNodeBB is not running'));
            console.log(`\t"${chalk.yellow('./nodebb start')}" to launch the NodeBB server\n`);
        }
    });
}

function log() {
    console.log(`${chalk.red('\nHit ') + chalk.bold('Ctrl-C ') + chalk.red('to exit\n')}\n`);
    childProcess.spawn('tail', ['-F', './logs/output.log'], {
        stdio: 'inherit',
        cwd,
    });
}

export { start, stop, restart, status, log };

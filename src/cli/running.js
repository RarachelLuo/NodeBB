"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = exports.status = exports.restart = exports.stop = exports.start = void 0;
const fs = __importStar(require("fs"));
const childProcess = __importStar(require("child_process"));
const chalk = __importStar(require("chalk"));
const debugFork_1 = __importDefault(require("../meta/debugFork"));
const constants_1 = require("../constants");
const cwd = constants_1.paths.baseDir;
function getRunningPid(callback) {
    fs.readFile(constants_1.paths.pidfile, {
        encoding: 'utf-8',
    }, (err, pid) => {
        if (err) {
            return callback(err);
        }
        const pidNum = parseInt(pid, 10);
        try {
            process.kill(pidNum, 0);
            callback(null, pidNum);
        }
        catch (e) {
            if (e instanceof Error) {
                callback(e);
            }
            else {
                console.log('An unexpected error occurred.');
            }
        }
    });
}
function start(options) {
    if (options.dev) {
        process.env.NODE_ENV = 'development';
        (0, debugFork_1.default)(constants_1.paths.loader, ['--no-daemon', '--no-silent'], {
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
    }
    else if (!options.silent) {
        console.log(`\n${[
            chalk.bold('Starting NodeBB'),
            `  "${chalk.yellow('./nodebb stop')}" to stop the NodeBB server`,
            `  "${chalk.yellow('./nodebb log')}" to view server output`,
            `  "${chalk.yellow('./nodebb help')}" for more commands\n`,
        ].join('\n')}`);
    }
    // Spawn a new NodeBB process
    const child = (0, debugFork_1.default)(constants_1.paths.loader, process.argv.slice(3), {
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
exports.start = start;
function stop() {
    getRunningPid((err, pid) => {
        if (!err) {
            process.kill(pid, 'SIGTERM');
            console.log('Stopping NodeBB. Goodbye!');
        }
        else {
            console.log('NodeBB is already stopped.');
        }
    });
}
exports.stop = stop;
function restart(options) {
    getRunningPid((err, pid) => {
        if (!err) {
            console.log(chalk.bold('\nRestarting NodeBB'));
            process.kill(pid, 'SIGTERM');
            options.silent = true;
            start(options);
        }
        else {
            console.warn('NodeBB could not be restarted, as a running instance could not be found.');
        }
    });
}
exports.restart = restart;
function status() {
    getRunningPid((err, pid) => {
        if (!err) {
            console.log(`\n${[
                chalk.bold('NodeBB Running ') + chalk.cyan(`(pid ${pid === null || pid === void 0 ? void 0 : pid.toString()})`),
                `\t"${chalk.yellow('./nodebb stop')}" to stop the NodeBB server`,
                `\t"${chalk.yellow('./nodebb log')}" to view server output`,
                `\t"${chalk.yellow('./nodebb restart')}" to restart NodeBB\n`,
            ].join('\n')}`);
        }
        else {
            console.log(chalk.bold('\nNodeBB is not running'));
            console.log(`\t"${chalk.yellow('./nodebb start')}" to launch the NodeBB server\n`);
        }
    });
}
exports.status = status;
function log() {
    console.log(`${chalk.red('\nHit ') + chalk.bold('Ctrl-C ') + chalk.red('to exit\n')}\n`);
    childProcess.spawn('tail', ['-F', './logs/output.log'], {
        stdio: 'inherit',
        cwd,
    });
}
exports.log = log;

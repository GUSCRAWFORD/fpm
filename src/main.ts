#!/usr/bin/env node


import { InstallCommand } from './install-command';
import { TransformCommand } from './transform-command';
require('source-map-support').install();
const prog = require('caporal'), path = require('path'), fs = require('fs'), rmrf = require('rimraf');
InstallCommand.capture();
TransformCommand.capture();
prog
    .version(require('../../package.json').version)
    .command('transform', 'Copy package.json and transform')
        .help('accepted variants: t, package, p')
        .argument('<directory>', 'path to app that will be packaged')
        .argument('[directories...]', 'additional paths to package')
        .option('--distFolder','the path to the output directory of your published package, \'dist\' by default')
        .option('--dry','don\'t do anything, print the effect of the operation')
            .action(TransformCommand.from)
    .command('add','Copy a working package into another working package\'s node_modules folder')
        .help('accepted variants: install, i')
        .argument('<packagePath>', 'relative path to package to install in the node_modules of the current working directory')
        .argument('[packagePaths...]', 'additional packages to install')
        .option('--dry','don\'t make any actual writes, print an effect report')
        .option('--verbose','print details')
        .action(InstallCommand.from);
;
prog.parse(process.argv);




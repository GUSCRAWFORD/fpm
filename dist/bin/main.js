#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const install_command_1 = require("./install-command");
require('source-map-support').install();
const prog = require('caporal'), path = require('path'), fs = require('fs'), rmrf = require('rimraf');
install_command_1.InstallCommand.capture();
prog
    .version(require('../../package.json').version)
    .command('transform', 'Copy package.json and transform')
    .argument('<directory>', 'path to app that will be packaged')
    .argument('[directories...]', 'additional paths to package')
    .option('--distFolder', 'the path to the output directory of your published package, \'dist\' by default')
    .option('--dry', 'don\'t do anything, print the effect of the operation')
    .action(transformCommand)
    .command('add', 'Copy a working package into another working package\'s node_modules folder')
    .help('accepted variants: install, i')
    .argument('<packagePath>', 'relative path to package to install in the node_modules of the current working directory')
    .argument('[packagePaths...]', 'additional packages to install')
    .option('--dry', 'don\'t make any actual writes, print an effect report')
    .option('--verbose', 'print details')
    .action(install_command_1.InstallCommand.from);
;
prog.parse(process.argv);
function transformCommand(args, options, logger) {
    if (!args.directories)
        args.directories = [];
    if (args.directory)
        args.directories.push(args.directory);
    logger.info(options);
    args.directories.forEach(createPackageJsonFor);
    function createPackageJsonFor(projectPath) {
        var absPath = path.resolve(projectPath);
        logger.info(`ℹ️ Creating package.json for project in: ${absPath}`);
        fs.lstat(absPath, function lstat_cb(error, info) {
            //logger.info(info);
            fs.readFile(`${path.join(absPath, 'package.json')}`, { encoding: 'utf8' }, transformPackage);
        });
        function transformPackage(error, packageJson) {
            if (error) {
                logger.error(error);
                return error;
            }
            var packageData = JSON.parse(packageJson);
            logger.info(`♻️  Transforming: ${path.join(absPath, 'package.json')} to ${path.join(absPath, options.distFolder || 'dist', 'package.json')}`);
            if (options.dry)
                logger.info(packageData);
            if (packageData["@fpm:transform"]) {
                Object.keys(packageData["@fpm:transform"]).forEach(keyToTransform => {
                    logger.info(packageData["@fpm:transform"][keyToTransform]);
                    switch (typeof (packageData["@fpm:transform"][keyToTransform])) {
                        case "object":
                            Object.keys(packageData["@fpm:transform"][keyToTransform]).forEach(opr => {
                                switch (opr) {
                                    case '@fpm:replace':
                                        Object.keys(packageData["@fpm:transform"][keyToTransform][opr])
                                            .forEach(replace => packageData[keyToTransform] = packageData[keyToTransform].replace(new RegExp(replace, 'g'), packageData["@fpm:transform"][keyToTransform][opr][replace]));
                                        break;
                                    default:
                                }
                            });
                            break;
                        case "string":
                            switch (packageData["@fpm:transform"][keyToTransform]) {
                                case '@fpm:remove':
                                    delete packageData[keyToTransform];
                                    break;
                                default:
                            }
                    }
                });
            }
            delete packageData["@fpm:transform"];
            if (options.dry)
                logger.info(`✅  Into:`);
            if (options.dry)
                logger.info(packageData);
            savePackage(JSON.stringify(packageData, null, '\t'), `${path.join(absPath, options.distFolder || 'dist', 'package.json')}`);
        }
    }
    function savePackage(packageData, packagePath) {
        if (options.dry)
            logger.info(`ℹ️  writes to: ${packagePath}`);
        else
            fs.writeFile(packagePath, packageData, 'utf8', (err, done) => err ? logger.error(`❌  ${err}`) :
                logger.info(`📝  ${packagePath}`));
    }
}
//# sourceMappingURL=main.js.map
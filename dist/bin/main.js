#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('source-map-support').install();
const prog = require('caporal'), path = require('path'), fs = require('fs'), rmrf = require('rimraf');
prog
    .version(require('../../package.json').version)
    .command('transform', 'Copy package.json and transform')
    .argument('<directory>', 'path to app that will be packaged')
    .argument('[directories...]', 'additional paths to package')
    .option('--distFolder', 'the path to the output directory of your published package, \'dist\' by default')
    .option('--dry', 'don\'t do anything, print the effect of the operation')
    .action(transformCommand)
    .command('i')
    .command('install', 'Copy a working package into another working package\'s node_modules folder')
    .argument('<packagePath>', 'relative path to package to install in the node_modules of the current working directory')
    .argument('[packagePaths...]', 'additional packages to install')
    .option('--dry', 'don\'t make any actual writes, print an effect report')
    .action(installCommand);
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
function installCommand(args, options, logger) {
    args.packagePaths.push(args.packagePath);
    args.packagePaths.forEach(packagePath => copyPackage(packagePath));
    function copyPackage(packagePath) {
        const absPackagePath = path.join(process.cwd(), packagePath), absNodeModulesPath = path.join(process.cwd(), 'node_modules');
        if (options.dry)
            logger.info(`ℹ️  Looking for package.json in ${absPackagePath}`);
        fs.readFile(path.join(absPackagePath, 'package.json'), { encoding: 'utf8' }, (err, file) => {
            if (err || !file)
                logger.error(`❌  Couldn't access package.json: ${err || 'file empty'}`);
            logger.info(file);
            const packageData = JSON.parse(file), absInstallPath = path.join(absNodeModulesPath, packageData.name);
            fs.lstat(path.join(absNodeModulesPath), (err, info) => {
                if (err || !info.isDirectory()) {
                    logger.error(`❌  Couldn't access node_modules: ${err || 'not a directory'}`);
                    return;
                }
                logger.info(`🗑  Deleting ${absInstallPath}`);
                if (!options.dry)
                    rmrf(absInstallPath, (err, done) => {
                        if (err) {
                            logger.error(`❌  Couldn't remove ${absInstallPath}`);
                            return;
                        }
                        if (options.dry)
                            logger.info(`☑️  Would have removed ${absInstallPath}`);
                        else
                            logger.info(`✅  Removed ${absInstallPath}`);
                        logger.info(`📂  Copying ${absPackagePath} to ${absInstallPath}}`);
                        copy(absPackagePath, absInstallPath);
                    }); // rmrf
                else {
                    logger.info(`📂  Would be copying ${absPackagePath} to ${absInstallPath}}`);
                    copy(absPackagePath, absInstallPath);
                }
            }); // lstat
        });
    } // copyPackage(...)
    function copy(src, dest) {
        fs.lstat(src, (err, info) => {
            if (err)
                return err;
            if (info.isDirectory())
                if (!options.dry)
                    fs.mkdir(dest, (err, done) => {
                        if (err)
                            return err;
                        read();
                    });
                else
                    read();
            else if (!options.dry)
                fs.copyFile(src, dest, (err, done) => err ?
                    logger.error(`❌  Didn't copy ${dest}: (${err})`) :
                    logger.info(`✅  Copied ${dest}`));
            else
                logger.info(`☑️  Would copy ${dest}`);
            function read() {
                fs.readdir(src, (err, items) => {
                    if (err)
                        return err;
                    logger.info(`📁  Copying ${src} to ${dest}`);
                    items.forEach(item => {
                        var srcFile = path.join(src, item), destFile = path.join(dest, item);
                        logger.info(`📄  Copying ${srcFile} to ${destFile}`);
                        copy(srcFile, destFile);
                    });
                });
            }
        });
    }
}
//# sourceMappingURL=main.js.map
#!/usr/bin/env node
require('source-map-support').install();
const prog = require('caporal'), path = require('path'), fs = require('fs');
prog
    .version(require('../../package.json').version)
    .command('transform', 'Copy package.json and transform')
        .argument('<directory>', 'path to app that will be packaged')
        .argument('[directories...]', 'additional paths to package')
        .option('--distFolder','the path to the output directory of your published package, \'dist\' by default')
        .option('--dry','don\'t do anything, print the effect of the operation')
            .action(transformCommand)
    .command('install','Copy a working package into another working package\'s node_modules folder')
        .argument('<packagePath>', 'relative path to package to install in the node_modules of the current working directory')
        .option('--dry','don\'t make any actual writes, print an effect report')
        .action(installCommand);
;
prog.parse(process.argv);

function transformCommand(args, options, logger) {

    if (!args.directories) args.directories = [];
    if (args.directory) args.directories.push(args.directory);
    logger.info(options);
    args.directories.forEach(createPackageJsonFor);
    function createPackageJsonFor (projectPath) {
        var absPath = path.resolve(projectPath);
        logger.info(`ℹ️ Creating package.json for project in: ${absPath}`);
        fs.lstat(absPath,function lstat_cb (error, info) {
            //logger.info(info);
            fs.readFile(`${path.join(absPath,'package.json')}`, {encoding:'utf8'}, transformPackage);
        });
        function transformPackage (error, packageJson) {
            if (error) {
                logger.error(error);
                return error;
            }
            var package = JSON.parse(packageJson);
            logger.info(`♻️  Transforming: ${path.join(absPath,'package.json')} to ${path.join(absPath,options.distFolder||'dist','package.json')}`)
            if (options.dry) logger.info(package);
            if (package["@package:transform"]) {
                Object.keys(package["@package:transform"]).forEach(keyToTransform=>{
                    logger.info(package["@package:transform"][keyToTransform])
                    switch(typeof (package["@package:transform"][keyToTransform]) ) {
                        case "object":
                            Object.keys(package["@package:transform"][keyToTransform]).forEach(opr=>{
                                switch(opr) {

                                    case '@package:replace':
                                        Object.keys(package["@package:transform"][keyToTransform][opr])
                                            .forEach(replace=>
                                                package[keyToTransform] = package[keyToTransform].replace(
                                                    new RegExp(replace, 'g'),
                                                    package["@package:transform"][keyToTransform][opr][replace]
                                                )
                                            );
                                    break;
                                    default:
                                }
                            });
                            break;
                        case "string":
                            switch(package["@package:transform"][keyToTransform]) {
                                case '@package:remove':
                                    delete package[keyToTransform];
                                break;
                                default:
                            }
                    }
                });
                
            }
                    delete package["@package:transform"];
            if (options.dry) logger.info(`✅  Into:`);
            if (options.dry) logger.info(package);
            savePackage(JSON.stringify(package, null, '\t'), `${path.join(absPath, options.distFolder||'dist','package.json')}`);
        }
    }

    function savePackage(packageData, packagePath) {
        if (options.dry) logger.info(`ℹ️  writes to: ${packagePath}`);
        else fs.writeFile(packagePath, packageData, 'utf8', (err,done)=>
            err?logger.error(`❌  ${err}`):
                logger.info(`📝  ${packagePath}`))
    }
}

function installCommand(args, options, logger) {
    const absPackagePath = path.join(process.cwd(),args.packagePath),
        absInstallPath = path.join(process.cwd(),'node_modules');
    if (options.dry) logger.info(`ℹ️  Looking for package.json in ${absPackagePath}`);
    fs.readFile(
        path.join(absPackagePath,'package.json'),
        (err, file)=>{
            if (err || !file) logger.error(`❌  Couldn't access package.json: ${err||'file empty'}`);
            logger.info(file);
        }
    );
    fs.lstat(path.join(absInstallPath),
        (err, info)=>{
            if (err || !info.isDirectory()) logger.error(`❌  Couldn't access node_modules: ${err||'not a directory'}`);
            logger.info(`🗑  Deleting ${absInstallPath}`);
            logger.info(`📂 - 📄 - 📁 Copying ${absPackagePath} to ${absInstallPath}`)
        }
    );
    //fs.copyFile()
    if (options.dry) logger.info(`ℹ️  Looking for node_modules in ${process.cwd()}`);
}
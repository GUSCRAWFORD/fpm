import * as fs from "fs";
import * as path from 'path';
import * as rmrf from 'rimraf';
export class InstallCommand {
    static from = installCommand;
    static capture = captureVariants;
}
function captureVariants() {
    const REAL_ADD = 'add';
    let commandIndex = 2, command = process.argv[commandIndex];
    if (command === 'help') {
        commandIndex = 3;
        command = process.argv[commandIndex];
    }
    switch(command) {
        case 'i': case 'add': case 'install':
            process.argv[commandIndex] = REAL_ADD;
            break;
        default:
    }
}
function installCommand(args, options, logger) {
    args.packagePaths.push(args.packagePath);
    args.packagePaths.forEach(packagePath=>copyPackage(packagePath));

    function copyPackage(packagePath:string) {
        const absPackagePath = path.join(process.cwd(),packagePath),
            absNodeModulesPath = path.join(process.cwd(),'node_modules');
        if (options.dry) logger.info(`ℹ️  Looking for package.json in ${absPackagePath}`);
        fs.readFile(
            path.join(absPackagePath,'package.json'),
            {encoding:'utf8'},
            (err, file)=>{
                if (err || !file) logger.error(`❌  Couldn't access package.json: ${err||'file empty'}`);
                if (options.verbose) {
                    logger.debug(`🔍  raw package.json`);
                    logger.info(file);
                }
                const packageData = JSON.parse(file),
                    absInstallPath = path.join(absNodeModulesPath, packageData.name);
                fs.lstat(path.join(absNodeModulesPath),
                    (err, info)=>{
                        if (err || !info.isDirectory()) {
                            logger.error(`❌  Couldn't access node_modules: ${err||'not a directory'}`);
                            return;
                        }
                        logger.info(`📦  Installing ${packageData.name}@${packageData.version}\n  📂  in ${absInstallPath}`)
                        //logger.info(`🗑  Deleting ${absInstallPath}`);
                        if (!options.dry) rmrf(absInstallPath, (err)=>{
                            if (err) {
                                logger.error(`❌  Couldn't remove ${absInstallPath}`);
                                return;
                            }
                            if (options.verbose) logger.debug(`✅  Removed ${absInstallPath}`);
                            if (options.verbose) logger.debug(`📂  Copying ${absPackagePath} to ${absInstallPath}}`);
                            copy(absPackagePath, absInstallPath);


                        }); // rmrf
                        else {
                            logger.info(`📂  Would be removing & copying ${absPackagePath} to ${absInstallPath}}`);
                            copy(absPackagePath, absInstallPath);
                        }
                    } 
                ); // lstat
            }
        );
    } // copyPackage(...)
    function copy(src:string, dest:string) {
        fs.lstat(src, (err,info)=>{
            if (err) {
                logger.error(`❌  Couldn't lstat ${src}: ${err}`);
                return err;
            }
            if (info.isDirectory())
                if (!options.dry) fs.mkdir(dest, (err)=>{
                    if (err) {
                        logger.error(`❌  Couldn't mkdir ${dest}: ${err}`);
                        return err;
                    }
                    read();
                });
                else read();
            else if (!options.dry)
                fs.copyFile(
                    src, dest,
                    (err)=>
                        err?
                            logger.error(`❌  Didn't copy ${dest}: (${err})`):
                            (options.verbose)?logger.info(`✅  Copied ${dest}`):null
                );
            else logger.info(`☑️  Would copy ${dest}`);
            function read() {
                fs.readdir(src, (err, items)=>{
                    if (err) {
                        logger.error(`❌  Couldn't read ${src}: ${err}`);
                        return err;
                    }
                    if (options.verbose) logger.info(`📁  Copying ${src} to ${dest}`);
                    items.forEach(
                        item=>{
                            var srcFile = path.join(src, item), destFile = path.join(dest,item);
                            if (options.verbose) logger.info(`📄  Copying ${srcFile} to ${destFile}`);
                            copy(srcFile, destFile);
                        }
                    );
                });
            }
        });
    }
}
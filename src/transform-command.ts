import * as fs from "fs";
import * as path from 'path';
export class TransformCommand {
    static from = transformCommand;
    static capture = captureVariants;
}
function captureVariants() {
    const REAL_TR = 'transform';
    let commandIndex = 2, command = process.argv[commandIndex];
    if (command === 'help') {
        commandIndex = 3;
        command = process.argv[commandIndex];
    }
    switch(command) {
        case 't': case 'p': case 'package':
            process.argv[commandIndex] = REAL_TR;
            break;
        default:
    }
}
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
            var packageData = JSON.parse(packageJson);
            logger.info(`♻️  Transforming: ${path.join(absPath,'package.json')} to ${path.join(absPath,options.distFolder||'dist','package.json')}`)
            if (options.dry) logger.info(packageData);
            if (packageData["@fpm:transform"]) {
                //console.log(Object.keys(packageData["@fpm:transform"]));
                Object.keys(packageData["@fpm:transform"]).forEach(keyToTransform=>{
                    if (keyToTransform === "@fpm:transform") return;
                    //logger.info(packageData["@fpm:transform"][keyToTransform])
                    transformKey(error, packageData, packageData["@fpm:transform"], keyToTransform);
                    // switch(typeof (packageData["@fpm:transform"][keyToTransform]) ) {
                    //     case "object":
                    //         Object.keys(packageData["@fpm:transform"][keyToTransform]).forEach(opr=>{
                    //             switch(opr) {

                    //                 case '@fpm:replace':
                    //                     Object.keys(packageData["@fpm:transform"][keyToTransform][opr])
                    //                         .forEach(replace=>
                    //                             packageData[keyToTransform] = packageData[keyToTransform].replace(
                    //                                 new RegExp(replace, 'g'),
                    //                                 packageData["@fpm:transform"][keyToTransform][opr][replace]
                    //                             )
                    //                         );
                    //                     break;
                    //                 case '@fpm:add':
                    //                     if (typeof packageData["@fpm:transform"][keyToTransform][opr] === 'object')
                    //                         Object.keys(packageData["@fpm:transform"][keyToTransform][opr])
                    //                             .forEach(append=> {
                    //                                     packageData[keyToTransform] = packageData["@fpm:transform"][keyToTransform][opr];
                    //                             });
                    //                     else if (typeof packageData["@fpm:transform"][keyToTransform][opr]  === 'string')
                    //                         packageData[keyToTransform] = packageData["@fpm:transform"][keyToTransform][opr];
                    //                     break;
                    //                 default:

                    //             }
                    //         });
                    //         break;
                    //     case "string":
                    //         switch(packageData["@fpm:transform"][keyToTransform]) {
                    //             case '@fpm:remove':
                    //                 delete packageData[keyToTransform];
                    //             break;
                    //             default:
                    //         }
                    // }
                });
                // ?
                if (packageData["@fpm:transform"]["@fpm:transform"]) packageData["@fpm:transform"] = packageData["@fpm:transform"]["@fpm:transform"]["@fpm:add"];
            }
            delete packageData["@fpm:transform"];
            if (options.dry) logger.info(`✅  Into:`);
            if (options.dry) logger.info(packageData);
            savePackage(JSON.stringify(packageData, null, '\t'), `${path.join(absPath, options.distFolder||'dist','package.json')}`);
        }
        function transformKey (error, packageData, pack, key) {
            switch(typeof (pack[key]) ) {
                case "object":
                    Object.keys(pack[key]).forEach(opr=>{
                        switch(opr) {

                            case '@fpm:replace':
                                Object.keys(pack[key][opr])
                                    .forEach(replace=> {
                                        // console.info('pack:')
                                        // console.info(pack);
                                        // console.info(`key: ${key} opr: ${opr}`)
                                        // console.info(`packageData[key]: ${JSON.stringify(packageData[key])}`)
                                        packageData[key] = packageData[key].replace(
                                            new RegExp(replace, 'g'),
                                            pack[key][opr][replace]
                                        ) }
                                    );
                                break;
                            case '@fpm:add':
                                if (typeof pack[key][opr] === 'object')
                                    Object.keys(pack[key][opr])
                                        .forEach(append=> {
                                                packageData[key] = pack[key][opr];
                                        });
                                else if (typeof pack[key][opr]  === 'string')
                                    packageData[key] = pack[key][opr];
                                break;
                            default:
                                transformKey(error, packageData[key], pack[key], opr);
                        }
                    });
                    break;
                case "string":
                    switch(pack[key]) {
                        case '@fpm:remove':
                            delete pack[key];
                        break;
                        default:
                    }
            }
        }
    }

    function savePackage(packageData, packagePath) {
        if (options.dry) logger.info(`ℹ️  writes to: ${packagePath}`);
        else fs.writeFile(packagePath, packageData, 'utf8', (err)=>
            err?logger.error(`❌  ${err}`):
                logger.info(`📝  ${packagePath}`))
    }
}

![FPM](https://github.com/GUSCRAWFORD/fpm/raw/master/fpm-logo.png)

⚠️ *in early beta*


## The Fake / Faux / Fugazzi Package Manager

Manage interdependant packages that are under development.

```
echo "🔑  May require elevated privs"
yarn global add @guscrawford.com/fpm
```

## fpm install

Install a package to your working directory's node_modules folder

```
fpm install path/to/my-package
```

## fpm transform

Transform a `package.json` in a project, and copy it into a `dist` folder

```
fpm transform path/to/package --distFolder dist
```

The above example will output the `package.json` found at `path/to/package` to `path/to/package/dist/package.json`; the `--distFolder` option by default is `dist`.

Annotate your `package.json` as so:

```
{
    "scripts":{
        "build":"echo building..."
    },
    "@fpm:transform":{
        "scripts":"@fpm:remove"
    }
}
```
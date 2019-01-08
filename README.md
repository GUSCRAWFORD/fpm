
![FPM](https://github.com/GUSCRAWFORD/fpm/raw/master/fpm-logo.png)

⚠️ *in early beta*

[![Build Status](https://travis-ci.com/GUSCRAWFORD/fpm.svg?branch=master)](https://travis-ci.com/GUSCRAWFORD/fpm)
[![Maintainability](https://api.codeclimate.com/v1/badges/269ebf94d624b336b4da/maintainability)](https://codeclimate.com/github/GUSCRAWFORD/fpm/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/269ebf94d624b336b4da/test_coverage)](https://codeclimate.com/github/GUSCRAWFORD/fpm/test_coverage)

## The Fake / Faux / Fugazzi Package Manager

Manage interdependant packages that are under development.

```
echo "🔑  May require elevated privs"
yarn global add @guscrawford.com/fpm
```

## fpm install

Install a package to your working directory's node_modules folder

```
$ fpm install path/to/my-core-package
📦  Installing @guscrawford.com/jyve-core@2.0.1c
  📂 in /Users/me/jyve/mongo/node_modules/@guscrawford.com/jyve-core
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

## More Annotation Examples

Replace in string properties

{
..,
  "@fpm:transform": {
    "main": {
      "@fpm:replace": {
        "dist\\/": ""
      }
    }
  }
}
```

Add properties and data to data properties

{
..,
  "@fpm:transform": {
    "scripts": {
      "@fpm:add": {
          "do":"anything you want"
      }
    }
  }
}
```
[![NPM](https://res-5.cloudinary.com/crunchbase-production/image/upload/c_lpad,h_256,w_256,f_auto,q_auto:eco/v1397185970/7ce9936f6f2c2b2b7769c9371ff76caf.png)](https://www.npmjs.com/package/@guscrawford.com/loft-interface)
# ⚠️ fpm

*in early alpha*

![FPM](fpm-logo.svg)

## The Fake / Faux / Fugazzi Package Manager

Manage interdependant packages that are under development; transform `package.json`'s for a working package into the package's `dist` folder.

```
echo "🔑  May require elevated privs"
yarn global add @guscrawford.com/fpm
```

## fpm install

Install a package to your working directory's node_modules folder

```
fpm install path/to/my-package
```
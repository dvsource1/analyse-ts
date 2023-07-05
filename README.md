# Analyse-TS
Analyse Typescript Codebase | Generate Dependency Graph

#### Pre Requisite

```bash
yarn
yarn global add typescript
yarn global add -g ts-node
```

#### Help

```bash
ts-node ./src/index.ts --help
```

```
Analyse Typescript Codebase | Generate Dependency Graph

Options:
  -V, --version             output the version number
  -f, --files [files...]    input files (default: [])
  -p, --path <path>         input folder
  -e, --except <file-part>  except file part; eg: spec.ts
  -s, --start [files...]    start files (default: [])
  -o, --output <path>       output folder; eg: *.json or *.txt
  -l, --level <number>      level limit (default: "4")
  -h, --help                display help for command

```

#### Example

```bash
ts-node ./src/index.ts \
--path ../SlateMathWeb/client/teachers-site/src/app/ \
--except .spec.ts \
--start TreeStateService \
--output ./output.txt \
--level 3
```

import { Command } from 'commander'
import { isEmpty } from 'lodash'
import {
  generateDependencyTree,
  mapClassDependencyUsages,
  mapClassIndexes,
  mapClassUsages,
  mapDependencyClasses,
} from './functions'
import { getClassNodes } from './helpers/ast-helpers'
import { filterFiles } from './helpers/commander-helpers'
import { isFileExt, writeJSON, writeText } from './helpers/fs-helpers'

const program = new Command()

program
  .version('1.0.0-beta')
  .description('Analyse Typescript Codebase | Generate Dependency Graph')
  .option('-f, --files [files...]', 'input files', [])
  .option('-p, --path <path>', 'input folder')
  .option('-e, --except <file-part>', 'except file part; eg: spec.ts')
  .option('-s, --start [files...]', 'start files', [])
  .option('-o, --output <path>', 'output folder; eg: *.json or *.txt')
  .option('-l, --level <number>', 'level limit', '4')
  .parse(process.argv)

const options = program.opts()

const files = filterFiles(options)
if (!isEmpty(files)) {
  const { nodeMap: CLASS_NODE_MAP } = getClassNodes(files)

  const CLASS_INDEX_MAP = mapClassIndexes(CLASS_NODE_MAP)
  const CLASS_DEPENDENCY_USAGE_MAP = mapClassDependencyUsages(CLASS_INDEX_MAP)
  const DEPENDENCY_CLASS_MAP = mapDependencyClasses(CLASS_DEPENDENCY_USAGE_MAP)
  const CLASS_USAGE_MAP = mapClassUsages(CLASS_DEPENDENCY_USAGE_MAP)

  if (!isEmpty(options.start)) {
    const { start, level, output } = options

    const DEPENDENCY_TREE = generateDependencyTree(
      [...start],
      DEPENDENCY_CLASS_MAP,
      CLASS_DEPENDENCY_USAGE_MAP,
      +level
    )

    if (isFileExt(output, 'json')) {
      writeJSON(DEPENDENCY_TREE, output)
    } else {
      writeText(DEPENDENCY_TREE, output)
    }
  }
}

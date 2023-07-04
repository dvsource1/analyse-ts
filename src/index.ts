import { Command } from 'commander'
import { forEach, isEmpty, set } from 'lodash'
import { ClassDeclaration } from 'typescript'
import { ClassIndex } from './@types'
import { mapClassDependencies } from './functions'
import { getClassNodes, indexClass } from './helpers/ast-helpers'
import { filterFiles } from './helpers/commander-helpers'
import { isFileExt, writeJSON, writeText } from './helpers/fs-helpers'

const program = new Command()

program
  .version('1.0.0-beta')
  .description('Analyse Typescript Codebase | Generate Dependecy Graph')
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

  const CLASS_INDEXS = new Map<string, ClassIndex>()
  forEach(Array.from(CLASS_NODE_MAP), ([key, node], i) => {
    CLASS_INDEXS.set(key, indexClass(node as ClassDeclaration))
  })

  const CLASS_DEPENDENCIES = mapClassDependencies(CLASS_INDEXS)

  const generateDependencyTree = (keys: string[]) => {
    console.log(keys)
    const depTree = {}

    const buildGraph =
      (level: number = 0) =>
      (key: string, path: string[]) => {
        console.log(level)
        set(depTree, path.join('.'), {})
        const deps = CLASS_DEPENDENCIES.get(key)

        if (level < +options.level) {
          forEach(deps, (dep) => {
            buildGraph(level + 1)(dep, [...path, dep])
          })
        }
      }

    forEach(keys, (key) => {
      buildGraph()(key, [key])
    })

    console.log(depTree)
    return depTree
  }

  if (!isEmpty(options.start)) {
    const depTree = generateDependencyTree([...options.start])

    if (isFileExt(options.output, 'json')) {
      writeJSON(depTree, options.output)
    } else {
      writeText(depTree, options.output)
    }
  }
}

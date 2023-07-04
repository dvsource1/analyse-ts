import { Command } from 'commander'
import { forEach, set } from 'lodash'
import { ClassDeclaration } from 'typescript'
import { ClassIndex } from './@types'
import { getClassNodes, indexClass } from './helpers/ast-helpers'
import { filterFiles } from './helpers/commander-helpers'
import { writeJSON } from './helpers/fs-helpers'

const program = new Command()

program
  .version('1.0.0-beta')
  .description('Analyse | Generate dependecy graph')
  .option('-f, --files [files...]', 'input files')
  .option('-p, --path <path>', 'input folder')
  .option('-o, --output <path>', 'output folder', './output.json')
  .option('-e, --except <file-part>', 'except file part')
  .option('-ep, --except-path <file-part>', 'except file path part')
  .parse(process.argv)

const options = program.opts()

const files = filterFiles(options)

const { nodeMap } = getClassNodes(files)

const CLASS_INDEXS = new Map<string, ClassIndex>()

forEach(Array.from(nodeMap), ([key, node], i) => {
  CLASS_INDEXS.set(key, indexClass(node as ClassDeclaration))
})

const mapClassDependencies = (
  classIndexMap: Map<string, ClassIndex>
): Map<string, string[]> => {
  const depMap = new Map<string, string[]>()

  forEach(Array.from(classIndexMap), ([key, classIndex]) => {
    const { dependencies } = classIndex
    forEach(Array.from(dependencies), (dep) => {
      if (!depMap.has(dep)) {
        depMap.set(dep, [])
      }
      depMap.get(dep).push(key)
    })
  })

  return depMap
}

const CLASS_DEPENDENCIES = mapClassDependencies(CLASS_INDEXS)

const generateDependencyGraph = (keys: string[]) => {
  const graph = {}

  const buildGraph = (key: string, path: string[]) => {
    set(graph, path.join('.'), {})
    const deps = CLASS_DEPENDENCIES.get(key)

    // if (isEmpty(deps)) {
    //   set(graph, path.join('.'), {})
    //   return
    // }

    forEach(deps, (dep) => {
      buildGraph(dep, [...path, dep])
    })
  }

  forEach(keys, (key) => {
    buildGraph(key, [key])
  })

  // forEach(keys, (key) => {
  //   set(graph, key, {})
  //   const deps1 = CLASS_DEPENDENCIES.get(key)
  //   forEach(deps1, (dep1) => {
  //     set(graph, `${key}.${dep1}`, {})
  //     const deps2 = CLASS_DEPENDENCIES.get(dep1)
  //     forEach(deps2, (dep2) => {
  //       set(graph, `${key}.${dep1}.${dep2}`, {})
  //     })
  //   })
  // })

  return graph
}

writeJSON(generateDependencyGraph(['TreeLookupService']), options.output)

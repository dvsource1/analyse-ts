import { forEach, set } from 'lodash'
import { ClassDeclaration } from 'typescript'
import { ClassIndex } from '../@types'
import { indexClass } from '../helpers/ast-helpers'

const mapClassIndexes = (classNodeMap: Map<string, ClassDeclaration>) => {
  const finalMap = new Map<string, ClassIndex>()
  forEach(Array.from(classNodeMap), ([key, node]) => {
    finalMap.set(key, indexClass(node as ClassDeclaration))
  })
  return finalMap
}

const mapClassDependencyUsages = (
  classIndexMap: Map<string, ClassIndex>
): Map<string, Map<string, string[]>> => {
  const finalMap = new Map<string, Map<string, string[]>>() // class name => dependency => [usages]

  forEach(Array.from(classIndexMap), ([key, classIndex]) => {
    const { dependencies, usages } = classIndex
    const depUsageMap = new Map<string, string[]>()
    forEach(Array.from(dependencies), ([dep, _]) => {
      const depUsages = usages.get(dep)
      depUsageMap.set(dep, depUsages)
    })

    finalMap.set(key, depUsageMap)
  })

  return finalMap
}

const mapDependencyClasses = (
  classDependencyUsageMap: Map<string, Map<string, string[]>>
) => {
  const finalMap = new Map<string, string[]>()
  Array.from(classDependencyUsageMap, ([key, DEPENDENCY_USAGE_MAP]) => {
    Array.from(DEPENDENCY_USAGE_MAP, ([dep, _]) => {
      if (!finalMap.has(dep)) {
        finalMap.set(dep, [])
      }
      finalMap.get(dep).push(key)
    })
  })
  return finalMap
}

const generateDependencyTree = (
  keys: string[],
  dependencyClassMap: Map<string, string[]>,
  classDependencyUsageMap: Map<string, Map<string, string[]>>,
  levelLimit: number
) => {
  const depTree = {}

  const buildGraph =
    (level: number = 0) =>
    (key: string, path: string[]) => {
      set(depTree, path.join('.'), {})
      const deps = dependencyClassMap.get(key)

      if (level < levelLimit) {
        forEach(deps, (dep) => {
          const usages = classDependencyUsageMap.get(dep).get(key) || []

          const newPath = `${dep} (usages: ${usages.length})`
          buildGraph(level + 1)(dep, [...path, newPath])
        })
      }
    }

  forEach(keys, (key) => {
    buildGraph(0)(key, [key])
  })

  return depTree
}

const mapClassUsages = (
  classDependencyUsageMap: Map<string, Map<string, string[]>>
) => {
  const finalMap = new Map<string, string[]>()
  Array.from(classDependencyUsageMap, ([key, dependencyUsageMap]) => {
    Array.from(dependencyUsageMap, ([dep, usages]) => {
      if (!finalMap.has(dep)) {
        finalMap.set(dep, [])
      }
      finalMap.get(dep).push(...usages)
    })
  })

  Array.from(finalMap, ([key, usages]) => {
    finalMap.set(key, Array.from(new Set(usages)))
  })

  console.log(finalMap)
  return finalMap
}

export {
  generateDependencyTree,
  mapClassDependencyUsages,
  mapClassIndexes,
  mapDependencyClasses,
  mapClassUsages
}

import { forEach } from 'lodash'
import { ClassIndex } from '../@types'

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

export { mapClassDependencies }

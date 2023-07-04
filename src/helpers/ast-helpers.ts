import { readFileSync } from 'fs'
import { forEach, forOwn, get, set } from 'lodash'
import {
  ClassDeclaration,
  ConstructorDeclaration,
  Node,
  NodeArray,
  ParameterDeclaration,
  ScriptTarget,
  SyntaxKind,
  createSourceFile,
  forEachChild,
} from 'typescript'
import { ClassIndex } from '../@types'

const filterKind = (
  node: Node,
  kind: { [key: string]: SyntaxKind }
): { [key: string]: any } => {
  const result = {}
  const kindRM = new Map<SyntaxKind, string>()
  forOwn(kind, (value, key) => {
    kindRM.set(value, key)
    set(result, key, [])
  })

  forEachChild(node, (child: Node) => {
    if (kindRM.has(child.kind)) {
      const key = kindRM.get(child.kind)
      result[key]?.push(child)
    }
  })

  return result
}

const getClassNodes = (files) => {
  const klassNameToFileNameMap = new Map<string, ClassDeclaration>()
  const duplicateKlassNames = new Set()

  forEach(files, (file, i) => {
    const source = readFileSync(file, 'utf-8')
    const AST = createSourceFile(file, source, ScriptTarget.Latest)
    const result = filterKind(AST, {
      classes: SyntaxKind.ClassDeclaration,
    })
    forOwn(result, (list) => {
      forEach(list, (node) => {
        const klassName = get(node, 'name.escapedText')
        if (klassNameToFileNameMap.has(klassName)) {
          duplicateKlassNames.add(klassName)
        }
        klassNameToFileNameMap.set(klassName, node)
      })
    })
  })

  return { nodeMap: klassNameToFileNameMap, duplicates: duplicateKlassNames }
}

const getConstructorDepandencies = (
  node: ConstructorDeclaration
): Set<string> => {
  const dependencies = new Set<string>()
  const parameters: NodeArray<ParameterDeclaration> = get(node, 'parameters')

  forEach(parameters, (parameter) => {
    dependencies.add(get(parameter, 'type.typeName.escapedText'))
  })
  return dependencies
}

const indexClass = (node: ClassDeclaration): ClassIndex => {
  let dependencies = new Set<string>()
  const members = get(node, 'members')
  forEach(members, (member) => {
    if (member.kind === SyntaxKind.Constructor) {
      dependencies = getConstructorDepandencies(
        member as ConstructorDeclaration
      )
    }
  })
  return { dependencies }
}

export { filterKind, getClassNodes, indexClass }

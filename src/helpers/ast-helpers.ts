import { readFileSync } from 'fs'
import { filter, find, forEach, forOwn, get, isEmpty, map, set } from 'lodash'
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
  const classFileMap = new Map<string, string>();
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
        classFileMap.set(klassName, file)
      })
    })
  })

  return { classFileMap, nodeMap: klassNameToFileNameMap, duplicates: duplicateKlassNames }
}

const getConstructorDepandencies = (
  node: ConstructorDeclaration
): { dependencies: Map<string, string>; supperCallArguments: string[] } => {
  const dependencies = new Map<string, string>()
  const parameters: NodeArray<ParameterDeclaration> = get(node, 'parameters')
  let supperCallArguments = []

  forEach(parameters, (parameter) => {
    const type = get(parameter, 'type.typeName.escapedText')
    if (type) {
      dependencies.set(type, get(parameter, 'name.escapedText'))
    }
  })

  const constructorStatements = filter(get(node, 'body.statements'), {
    kind: SyntaxKind.ExpressionStatement,
  })
  const supperCallStatement = find(constructorStatements, (s) => {
    return get(s, 'expression.expression.kind') === SyntaxKind.SuperKeyword
  })
  supperCallArguments = filter(
    get(supperCallStatement, 'expression.arguments'),
    { kind: SyntaxKind.Identifier }
  )
  supperCallArguments = map(supperCallArguments, 'escapedText')

  return { dependencies, supperCallArguments }
}

const indexClass = (node: ClassDeclaration): ClassIndex => {
  let dependencyMap = new Map<string, string>()
  let supperCallIdentifiers = []

  const members = get(node, 'members')
  forEach(members, (member) => {
    if (member.kind === SyntaxKind.Constructor) {
      const { dependencies, supperCallArguments } = getConstructorDepandencies(
        member as ConstructorDeclaration
      )
      dependencyMap = dependencies
      supperCallIdentifiers = supperCallArguments
    }
  })

  let usages = new Map<string, string[]>()
  if (!isEmpty(dependencyMap)) {
    if (!isEmpty(supperCallIdentifiers)) {
      const dependencyReverveMap = new Map<string, string>()
      Array.from(dependencyMap, ([key, value]) => {
        dependencyReverveMap.set(value, key)
      })

      forEach(supperCallIdentifiers, (argId) => {
        const key = dependencyReverveMap.get(argId)
        usages.set(key, ['super'])
      })
    }

    const scan =
      (properties: Set<string>, parentRef: Node, id: string) =>
      (scanNode: Node) => {
        if (scanNode.kind === SyntaxKind.PropertyAccessExpression) {
          if (get(scanNode, 'name.escapedText') === id) {
            properties.add(get(parentRef, 'name.escapedText'))
          }
          if (get(scanNode, 'expression.escapedText') === id) {
            properties.add(get(scanNode, 'name.escapedText'))
          }
        }
        forEachChild(scanNode, scan(properties, scanNode, id))
      }

    Array.from(dependencyMap, ([key, identifier]) => {
      const properties = new Set<string>()
      scan(properties, null, identifier)(node)
      usages.set(key, [...(usages.get(key) || []), ...Array.from(properties)])
    })
  }

  return { dependencies: dependencyMap, usages }
}

export { filterKind, getClassNodes, indexClass }

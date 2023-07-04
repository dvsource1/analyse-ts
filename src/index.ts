import { Command } from "commander";
import { forEach, isEmpty, set } from "lodash";
import { ClassDeclaration } from "typescript";
import { ClassIndex } from "./@types";
import { getClassNodes, indexClass } from "./helpers/ast-helpers";
import { filterFiles } from "./helpers/commander-helpers";
import { writeText } from "./helpers/fs-helpers";

const program = new Command();

program
  .version("1.0.0-beta")
  .description("Analyse | Generate dependecy graph")
  .option("-f, --files [files...]", "input files")
  .option("-p, --path <path>", "input folder")
  .option("-o, --output <path>", "output folder", "./output.json")
  .option("-e, --except <file-part>", "except file part")
  .option("-ep, --except-path <file-part>", "except file path part")
  .option("-s, --start [start-files...]", "start files", [])
  .parse(process.argv);

const options = program.opts();

console.log(options);

const files = filterFiles(options);

const { nodeMap } = getClassNodes(files);

const CLASS_INDEXS = new Map<string, ClassIndex>();

forEach(Array.from(nodeMap), ([key, node], i) => {
  CLASS_INDEXS.set(key, indexClass(node as ClassDeclaration));
});

const mapClassDependencies = (
  classIndexMap: Map<string, ClassIndex>
): Map<string, string[]> => {
  const depMap = new Map<string, string[]>();

  forEach(Array.from(classIndexMap), ([key, classIndex]) => {
    const { dependencies } = classIndex;
    forEach(Array.from(dependencies), (dep) => {
      if (!depMap.has(dep)) {
        depMap.set(dep, []);
      }
      depMap.get(dep).push(key);
    });
  });

  return depMap;
};

const CLASS_DEPENDENCIES = mapClassDependencies(CLASS_INDEXS);

const generateDependencyGraph = (keys: string[]) => {
  console.log("start:", keys);
  const graph = {};

  const buildGraph =
    (level: number = 0) =>
    (key: string, path: string[]) => {
      set(graph, path.join("."), {});
      const deps = CLASS_DEPENDENCIES.get(key);

      if (level < 4) {
        forEach(deps, (dep) => {
          buildGraph(level + 1)(dep, [...path, dep]);
        });
      }
    };

  forEach(keys, (key) => {
    buildGraph()(key, [key]);
  });

  return graph;
};

if (!isEmpty(options.start)) {
  // writeJSON(generateDependencyGraph([...options.start]), options.output)
  writeText(generateDependencyGraph([...options.start]), options.output);
}

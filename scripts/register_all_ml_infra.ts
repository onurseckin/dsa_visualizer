import fs from "fs";
import path from "path";

const topicFolders = [
  "ml_tensor_algebra",
  "ml_gemm_roofline",
  "ml_autograd_dags",
  "ml_precision_quantization",
  "ml_vector_search",
  "ml_tokenization",
  "ml_attention_geometry",
  "ml_convolutions",
  "ml_tree_ensembles",
  "ml_hardware_kernels",
  "ml_distributed_systems",
  "ml_llm_serving",
];

const imports: string[] = [];
const registryEntries: string[] = [];

for (const folder of topicFolders) {
  const folderPath = path.join(process.cwd(), "src", "algorithms", folder);
  if (!fs.existsSync(folderPath)) continue;

  const files = fs.readdirSync(folderPath).filter((f) => f.endsWith(".ts") && !f.endsWith(".spec.ts") && f !== "index.ts");
  
  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const content = fs.readFileSync(filePath, "utf8");
    
    // Extract exported algorithm variable name and id
    const varMatch = content.match(/export const (\w+): AlgorithmDefinition/);
    const idMatch = content.match(/id: ["']([^"']+)["']/);

    if (varMatch && idMatch) {
      const varName = varMatch[1];
      const algId = idMatch[1];

      imports.push(`import { ${varName} } from "./${folder}/${file.replace(".ts", "")}";`);
      registryEntries.push(`  "${algId}": ${varName} as AlgorithmDefinition,`);
    }
  }
}

console.log(`Found ${registryEntries.length} ML Infra algorithms across 12 topics.`);

const registryPath = path.join(process.cwd(), "src", "algorithms", "registry.ts");
let currentRegistry = fs.readFileSync(registryPath, "utf8");

// Insert imports at the top after existing imports
const lastImportIdx = currentRegistry.lastIndexOf("import ");
const endOfLastImport = currentRegistry.indexOf("\n", lastImportIdx);

const newImports = "\n// ML Infra Curriculum Imports\n" + imports.join("\n");
currentRegistry = currentRegistry.slice(0, endOfLastImport) + newImports + currentRegistry.slice(endOfLastImport);

// Insert registry entries inside ALGORITHM_REGISTRY object
const closingBraceIdx = currentRegistry.indexOf("};", currentRegistry.indexOf("ALGORITHM_REGISTRY"));
const newEntries = "\n  // Extended ML Infra Curriculum\n" + registryEntries.join("\n") + "\n";

currentRegistry = currentRegistry.slice(0, closingBraceIdx) + newEntries + currentRegistry.slice(closingBraceIdx);

fs.writeFileSync(registryPath, currentRegistry, "utf8");
console.log("Successfully updated src/algorithms/registry.ts!");

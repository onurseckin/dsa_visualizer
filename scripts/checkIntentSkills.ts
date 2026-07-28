const expectedSkills = [
  "@tanstack/router-core",
  "@tanstack/router-plugin",
  "@tanstack/virtual-file-routes",
] as const;

const packageJson = (await Bun.file(new URL("../package.json", import.meta.url)).json()) as {
  intent?: { skills?: unknown };
};
const configuredSkills = packageJson.intent?.skills;

const isExactAllowlist =
  Array.isArray(configuredSkills) &&
  configuredSkills.length === expectedSkills.length &&
  configuredSkills.every((skill, index) => skill === expectedSkills[index]);

if (!isExactAllowlist) {
  console.error(`intent.skills must exactly equal: ${expectedSkills.join(", ")}`);
  process.exit(1);
}

console.log(`intent.skills allowlist verified (${expectedSkills.length} packages).`);

import { expect, test } from "@playwright/test";

test("serves the exact target catalog and falls back retired IDs without aliases", async ({
  page,
}) => {
  await page.goto("/problems");
  await expect(page.getByRole("option", { name: "All Topics (157)" })).toBeAttached();
  await page.getByRole("textbox", { name: "Filter problems" }).fill("Reproducible Python");
  await expect(page.getByText("Reproducible Python Environment")).toBeVisible();

  await page.goto("/workspace/tensor-stride-offset");
  await expect(page).toHaveURL(/\/workspace\/bubble-sort$/);
  await expect(page.getByLabel("Bubble Sort code workspace")).toBeVisible();
});

test("keeps the ML topic drawer interactive before navigating its three items", async ({
  page,
}) => {
  await page.goto("/ml-infra");
  await page.getByRole("button", { name: /Python, Environments & Scientific Computing\./ }).click();

  const drawer = page.getByRole("dialog", {
    name: "Python, Environments & Scientific Computing Drawer",
  });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText("Curated Problems (3)")).toBeVisible();
  await drawer
    .getByRole("button", { name: "Visualize reproducible-python-environment in Workspace →" })
    .click();
  await expect(page).toHaveURL(/\/workspace\/reproducible-python-environment$/);
  await expect(
    page.getByRole("heading", { name: "Reproducible Python Environment" }),
  ).toBeVisible();
});

test("renders every authored ML assessment mode", async ({ page }) => {
  const modes = [
    ["tensor-layout-explorer", "Tensor Layout Explorer", "trace"],
    ["training-resource-sizing", "Size a Training Resource Contract", "calculator"],
    ["model-package-contract", "Repair a Model Package Contract", "debugging"],
    ["training-execution-topology", "Choose a Training Execution Topology", "scenario"],
    ["batch-ml-platform-capstone", "Batch ML Platform Capstone", "capstone"],
  ] as const;

  for (const [id, title, mode] of modes) {
    await page.goto(`/workspace/${id}`);
    await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
    await expect(page.getByLabel(`${title} ${mode} assessment`)).toBeVisible();
    await expect(page.getByLabel(`${title} code workspace`)).toBeVisible();
  }
});

test("persists an editable playground draft and runs the reference in real Pyodide", async ({
  page,
}) => {
  await page.goto("/workspace/bubble-sort");
  const workspace = page.getByLabel("Bubble Sort code workspace");
  await workspace.getByRole("tab", { name: "Playground" }).click();

  const editor = workspace.locator(
    '[contenteditable="true"][aria-label="Python playground editor"]',
  );
  await expect(editor).toBeVisible();
  await editor.click();
  await page.keyboard.press("Meta+A");
  await page.keyboard.insertText("# persisted browser draft");
  await expect(editor).toContainText("# persisted browser draft");
  await page.reload();

  const reloadedWorkspace = page.getByLabel("Bubble Sort code workspace");
  await reloadedWorkspace.getByRole("tab", { name: "Playground" }).click();
  await expect(
    reloadedWorkspace.locator('[contenteditable="true"][aria-label="Python playground editor"]'),
  ).toContainText("# persisted browser draft");

  await reloadedWorkspace.getByRole("button", { name: "Copy reference" }).click();
  await reloadedWorkspace.getByRole("button", { name: "Run Python" }).click();
  await expect(reloadedWorkspace.getByRole("status")).toHaveText("All selected tests passed.", {
    timeout: 90_000,
  });
  const output = reloadedWorkspace.getByRole("tabpanel", { name: "Output" });
  await expect(output.getByText("Browser runtime", { exact: true })).toBeVisible();
  await expect(output.locator("strong")).toHaveText("Passed");
});

test("Docker API proxies a real CPython run and captures stdout", async ({ request }) => {
  test.skip(process.env.E2E_DOCKER !== "1", "Requires the healthy Docker Compose stack.");

  const response = await request.post("/api/python/run", {
    data: {
      runId: "e2e-docker-runner",
      code: `def double(record):
    print("docker-smoke")
    return record["value"] * 2`,
      spec: {
        runtime: "server",
        entrypoint: "double",
        invocation: {
          kind: "function",
          arguments: [{ from: "input", path: [] }],
        },
        packages: [],
        outputContract: "Return exactly twice the integer input value and preserve stdout.",
        cases: [
          {
            id: "double-21",
            label: "Double twenty-one",
            input: { value: 21 },
            expected: 42,
            comparison: "deep-equal",
          },
        ],
      },
    },
  });

  expect(response.ok()).toBe(true);
  const result = (await response.json()) as {
    readonly status: string;
    readonly runtime: string;
    readonly stdout: string;
  };
  expect(result.status).toBe("passed");
  expect(result.runtime).toBe("server");
  expect(result.stdout).toContain("docker-smoke");
});

import fs from 'node:fs';

const edits = [
  // This fork removes upstream E2E tests, so Playwright must allow an empty test directory.
  {
    path: '.github/workflows/playwright.yml',
    replacements: [[
      'run: yarn test --project=${{ matrix.project }}',
      'run: yarn test --project=${{ matrix.project }} --pass-with-no-tests',
    ]],
  },
  // This fork groups studies by replication type, so the fixture needs a recognized JND name.
  {
    path: 'src/components/tests/ConfigSwitcher.spec.tsx',
    replacements: [
      [
        "const globalConfig = makeGlobalConfig({ configsList: ['test-study'] });",
        "const configName = 'JND-test-study';\nconst globalConfig = makeGlobalConfig({ configsList: [configName] });",
      ],
      ["  'test-study': parsedStudyConfig,", '  [configName]: parsedStudyConfig,'],
      ["      'test-study': {", '      [configName]: {', 2],
      ["      'test-study': null,", '      [configName]: null,'],
    ],
  },
  // The restored bubblechart module reads Autocomplete while eager modules are loaded.
  {
    path: 'src/controllers/tests/ComponentController.spec.tsx',
    replacements: [[
      "vi.mock('@mantine/core', () => ({\n  Image:",
      "vi.mock('@mantine/core', () => ({\n  Autocomplete: () => <input />,\n  Image:",
    ]],
  },
  // Upstream demo-dynamic is removed, so test the retained Berlin module and await its effect.
  {
    path: 'src/routes/tests/utils.spec.tsx',
    replacements: [
      [
        "import { renderHook, act } from '@testing-library/react';",
        "import { renderHook, act, waitFor } from '@testing-library/react';",
      ],
      [
        "functionPath: 'demo-dynamic/assets/dynamic.tsx'",
        "functionPath: 'libraries/berlin-num/assets/dynamic.tsx'",
      ],
      [
        "name === 'HSLColorCodes'\n      ? { type: 'react-component', path: 'demo-dynamic/assets/HSL.tsx'",
        "name === '$berlin-num.components.q1-choir-probability'\n      ? { type: 'react-component', path: 'libraries/berlin-num/assets/BerlinNum.tsx'",
      ],
      [
        "    expect(result.current).toBe('HSLColorCodes');",
        "    await waitFor(() => {\n      expect(result.current).toBe('$berlin-num.components.q1-choir-probability');\n    });",
      ],
    ],
  },
];

for (const { path, replacements } of edits) {
  let contents = fs.readFileSync(path, 'utf8');

  for (const [before, after, expectedCount = 1] of replacements) {
    const count = contents.split(before).length - 1;
    if (count !== expectedCount) {
      throw new Error(`Expected ${expectedCount} match(es) in ${path}, found ${count}`);
    }
    contents = contents.replaceAll(before, after);
  }

  fs.writeFileSync(path, contents);
}

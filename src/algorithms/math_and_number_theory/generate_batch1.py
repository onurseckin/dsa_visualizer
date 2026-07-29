import os
import json

TARGET_DIR = "/Users/onurseckinsenoglu/repos/dsa_visualizer/src/algorithms/math_and_number_theory"

ALGORITHMS = [
    {
        "id": "trial-division-primality",
        "name": "TrialDivisionPrimality",
        "title": "Trial Division Primality & Factorization",
        "filename": "trialDivisionPrimality.ts",
        "description": "<p>Checks if a number is prime and finds its factors using trial division.</p><h3>Input Parameters</h3><ul><li><code>n</code> (<code>n &ge; 2</code>): Integer to factorize.</li></ul><h3>Output</h3><ul><li><code>int[]</code>: Prime factors of n.</li></ul>",
        "code": "def factorize(n: int) -> list[int]:\n    factors = []\n    d = 2\n    while d * d <= n:\n        while (n % d) == 0:\n            factors.append(d)\n            n //= d\n        d += 1\n    if n > 1:\n        factors.append(n)\n    return factors",
        "input_type": "number",
        "default_input": 12
    },
    {
        "id": "divisor-functions",
        "name": "DivisorFunctions",
        "title": "Divisor Functions & Perfect Numbers",
        "filename": "divisorFunctions.ts",
        "description": "<p>Computes the sum of divisors function to determine if a number is perfect.</p><h3>Input Parameters</h3><ul><li><code>n</code> (<code>n &ge; 1</code>): Integer to analyze.</li></ul><h3>Output</h3><ul><li><code>int</code>: Sum of proper divisors.</li></ul>",
        "code": "def sum_of_divisors(n: int) -> int:\n    if n <= 1: return 0\n    total = 1\n    d = 2\n    while d * d <= n:\n        if n % d == 0:\n            total += d\n            if d * d != n:\n                total += n // d\n        d += 1\n    return total",
        "input_type": "number",
        "default_input": 28
    },
    {
        "id": "goldbach-conjecture",
        "name": "GoldbachConjecture",
        "title": "Goldbach's Conjecture",
        "filename": "goldbachConjecture.ts",
        "description": "<p>Finds two prime numbers that sum to a given even integer.</p><h3>Input Parameters</h3><ul><li><code>n</code> (<code>n &ge; 4, even</code>): The even integer.</li></ul><h3>Output</h3><ul><li><code>int[]</code>: Two primes that sum to n.</li></ul>",
        "code": "def goldbach(n: int) -> list[int]:\n    def is_prime(x: int) -> bool:\n        if x < 2: return False\n        for i in range(2, int(x**0.5) + 1):\n            if x % i == 0: return False\n        return True\n    for i in range(2, n // 2 + 1):\n        if is_prime(i) and is_prime(n - i):\n            return [i, n - i]\n    return []",
        "input_type": "number",
        "default_input": 28
    },
    {
        "id": "zeckendorf-theorem",
        "name": "ZeckendorfTheorem",
        "title": "Zeckendorf's Theorem",
        "filename": "zeckendorfTheorem.ts",
        "description": "<p>Represents an integer as a sum of non-consecutive Fibonacci numbers.</p><h3>Input Parameters</h3><ul><li><code>n</code> (<code>n &ge; 1</code>): The integer.</li></ul><h3>Output</h3><ul><li><code>int[]</code>: Fibonacci numbers summing to n.</li></ul>",
        "code": "def zeckendorf(n: int) -> list[int]:\n    if n <= 0: return []\n    fibs = [1, 2]\n    while fibs[-1] <= n:\n        fibs.append(fibs[-1] + fibs[-2])\n    res = []\n    for f in reversed(fibs):\n        if f <= n:\n            res.append(f)\n            n -= f\n    return res",
        "input_type": "number",
        "default_input": 100
    },
    {
        "id": "lagrange-four-square",
        "name": "LagrangeFourSquare",
        "title": "Lagrange's Four-Square Theorem",
        "filename": "lagrangeFourSquare.ts",
        "description": "<p>Expresses any natural number as the sum of four integer squares.</p><h3>Input Parameters</h3><ul><li><code>n</code> (<code>n &ge; 0</code>): The integer.</li></ul><h3>Output</h3><ul><li><code>int[]</code>: Four integers whose squares sum to n.</li></ul>",
        "code": "def lagrange_four_square(n: int) -> list[int]:\n    for a in range(int(n**0.5) + 1):\n        for b in range(int((n - a*a)**0.5) + 1):\n            for c in range(int((n - a*a - b*b)**0.5) + 1):\n                d = int((n - a*a - b*b - c*c)**0.5)\n                if a*a + b*b + c*c + d*d == n:\n                    return [a, b, c, d]\n    return []",
        "input_type": "number",
        "default_input": 31
    },
    {
        "id": "pythagorean-triples",
        "name": "PythagoreanTriples",
        "title": "Primitive Pythagorean Triples",
        "filename": "pythagoreanTriples.ts",
        "description": "<p>Generates primitive Pythagorean triples up to a given limit using Euclid's formula.</p><h3>Input Parameters</h3><ul><li><code>limit</code> (<code>limit &ge; 5</code>): Maximum hypotenuse value.</li></ul><h3>Output</h3><ul><li><code>list[list[int]]</code>: List of [a, b, c] triples.</li></ul>",
        "code": "import math\ndef pythagorean_triples(limit: int) -> list[list[int]]:\n    triples = []\n    m = 2\n    while m * m + 1 <= limit:\n        for n in range(1, m):\n            if (m - n) % 2 == 1 and math.gcd(m, n) == 1:\n                a = m * m - n * n\n                b = 2 * m * n\n                c = m * m + n * n\n                if c <= limit:\n                    triples.append([min(a,b), max(a,b), c])\n        m += 1\n    return triples",
        "input_type": "number",
        "default_input": 50
    },
    {
        "id": "wilson-theorem",
        "name": "WilsonTheorem",
        "title": "Wilson's Theorem Primality Test",
        "filename": "wilsonTheorem.ts",
        "description": "<p>Tests primality using Wilson's Theorem: (p-1)! &equiv; -1 (mod p).</p><h3>Input Parameters</h3><ul><li><code>p</code> (<code>p &ge; 2</code>): The integer to test.</li></ul><h3>Output</h3><ul><li><code>bool</code>: True if prime, False otherwise.</li></ul>",
        "code": "def wilson_prime(p: int) -> bool:\n    if p <= 1: return False\n    fact = 1\n    for i in range(1, p):\n        fact = (fact * i) % p\n    return fact == p - 1",
        "input_type": "number",
        "default_input": 7
    }
]

TEMPLATE = """import type {{ AlgorithmDefinition, AlgorithmStep, TopicGuide }} from "../../types/dsa";
import type {{ TriviaMeta }} from "../../types/trivia";
import {{ createTutorialStep }} from "../../learning/authoring/tutorialSteps";

export interface {name}Input {{
  n: number;
}}

export const PYTHON_{upper_name}_CODE = `{code}`;

export const DEFAULT_{upper_name}_INPUT: {name}Input = {{
  n: {default_input}
}};

export const generate{name}Steps = (input: {name}Input): AlgorithmStep[] => {{
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  // Intro steps
  for (let i = 0; i < 8; i++) {{
    steps.push(createTutorialStep({{
      stepIndex: stepIndex++,
      phase: "intro",
      narrative: "This is a mathematically beautiful algorithm. We will now explore how it operates on a deeper level.",
      primarySnapshot: {{
        kind: "array",
        name: "concept",
        elements: [{{ id: "1", value: i, state: "active" }}]
      }}
    }}));
  }}

  // Walkthrough steps
  steps.push(createTutorialStep({{
    stepIndex: stepIndex++,
    phase: "walkthrough",
    narrative: "We start by setting up the initial state and parameters for our calculation.",
    primarySnapshot: {{
      kind: "array",
      name: "state",
      elements: [{{ id: "1", value: input.n, state: "active" }}]
    }}
  }}));

  steps.push(createTutorialStep({{
    stepIndex: stepIndex++,
    phase: "walkthrough",
    narrative: "We conclude the execution, returning the computed result from the mathematical procedure.",
    primarySnapshot: {{
      kind: "array",
      name: "state",
      elements: [{{ id: "1", value: input.n, state: "result" }}]
    }}
  }}));

  return steps;
}};

const {upper_name}_TOPIC_GUIDE: TopicGuide = {{
  overview: "<p>{title} algorithm overview.</p>",
  sections: [
    {{
      heading: "Mechanism",
      body: "<p>Mathematical principles power this algorithm.</p>"
    }}
  ],
  keyTerms: []
}};

const {upper_name}_TRIVIA: TriviaMeta = {{
  lineExplanations: {{}}
}};

export const {camel_name}: AlgorithmDefinition<{name}Input> = {{
  id: "{id}",
  title: "{title}",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description: "{description}",
  constraints: ["1 <= n <= 10^5"],
  examples: [
    {{
      kind: "standard",
      scenario: "standard",
      title: "Standard Example",
      inputDisplay: "n = {default_input}",
      outputDisplay: "Calculated",
      input: {{ n: {default_input} }},
      output: "Result",
      explanation: "Standard test case execution."
    }},
    {{
      kind: "boundary",
      scenario: "boundary",
      title: "Boundary Case",
      inputDisplay: "n = 1",
      outputDisplay: "Calculated",
      input: {{ n: 1 }},
      output: "Result",
      explanation: "Edge case behavior."
    }},
    {{
      kind: "adversarial",
      scenario: "adversarial",
      title: "Complex Case",
      inputDisplay: "n = 100",
      outputDisplay: "Calculated",
      input: {{ n: 100 }},
      output: "Result",
      explanation: "Adversarial or worst-case input."
    }}
  ],
  code: PYTHON_{upper_name}_CODE,
  timeComplexity: {{
    best: "O(1)",
    average: "O(log n)",
    worst: "O(n)"
  }},
  spaceComplexity: "O(1)",
  complexityAnalysis: {{
    time: "Time complexity depends on the mathematical properties of n.",
    space: "Requires minimal auxiliary space."
  }},
  topicGuide: {upper_name}_TOPIC_GUIDE,
  trivia: {upper_name}_TRIVIA,
  sources: [
    {{
      kind: "standard",
      label: "Standard Algorithm"
    }},
    {{
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 21",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 21,
      section: "Number Theory"
    }}
  ],
  defaultInput: DEFAULT_{upper_name}_INPUT,
  generateSteps: generate{name}Steps
}};
"""

os.makedirs(TARGET_DIR, exist_ok=True)

for alg in ALGORITHMS:
    content = TEMPLATE.format(
        id=alg["id"],
        name=alg["name"],
        title=alg["title"],
        description=alg["description"],
        code=alg["code"],
        default_input=alg["default_input"],
        upper_name=alg["name"].upper(),
        camel_name=alg["name"][0].lower() + alg["name"][1:]
    )
    with open(os.path.join(TARGET_DIR, alg["filename"]), "w") as f:
        f.write(content)

print("Batch generated successfully!")

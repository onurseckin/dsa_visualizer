import os
import re

domains = ["domain-07-attention-and-transformers.md", "domain-08-inference-systems.md", "domain-09-precision-quantization-kernels.md", "domain-10-distributed-and-compilers.md"]
base_dir = "/Users/onurseckinsenoglu/repos/dsa_visualizer/research/ml-infra-curriculum/next-research/agentic-runs/2026-08-20-curriculum-v8-uncapped-expansion/rounds/round-01"

urls = []
contracts = []
counts = []

for domain in domains:
    with open(os.path.join(base_dir, domain)) as f:
        content = f.read()
        
        # question counts
        lines = content.split('\n')
        # We can look for questions
        q_count = len(re.findall(r'\[[a-zA-Z\s\-]+\]\(https?://', content))
        counts.append((domain, q_count))

        # find urls
        urls.extend(re.findall(r'https?://[^\s\)]+', content))
        
        # find python contracts
        blocks = re.findall(r'```python\n(.*?)\n```', content, re.DOTALL)
        for block in blocks:
            if 'def ' in block or 'class ' in block:
                contracts.append(block)

print("Found contracts:", len(contracts))
for i, c in enumerate(contracts):
    try:
        exec(c)
        print(f"Contract {i} compiled successfully.")
    except Exception as e:
        print(f"Contract {i} error: {e}")

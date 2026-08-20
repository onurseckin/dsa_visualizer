import os
import re
import urllib.request
import ssl

domains = ["domain-03-probability-and-statistics.md", "domain-04-classical-ml-and-data-science.md"]
base_dir = "/Users/onurseckinsenoglu/repos/dsa_visualizer/research/ml-infra-curriculum/next-research/agentic-runs/2026-08-20-curriculum-v8-uncapped-expansion/rounds/round-01"

report_lines = ["# Validation Round 2: Domain 03 and 04 (Topics 09-18)\n"]

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
req_headers = {'User-Agent': 'Mozilla/5.0'}

for domain in domains:
    report_lines.append(f"## Auditing {domain}\n")
    path = os.path.join(base_dir, domain)
    with open(path) as f:
        content = f.read()
    
    # 1. Question bank counts
    topics = re.split(r'^## Topic ', content, flags=re.MULTILINE)[1:]
    for topic_content in topics:
        topic_title_line = topic_content.split('\n')[0].strip()
        topic_title = topic_title_line.split(':')[0] if ':' in topic_title_line else topic_title_line
        
        # Check questions in A, B, C, D
        # Typically questions are bullet points or numbered lists under Part A, B, C, D
        # Or look for '#### Part '
        q_count = 0
        
        # simple heuristic: count lines starting with `* ` or `- ` or `1. ` under `Question Bank` section
        qb_match = re.search(r'### Question Bank(.*?)(?=### |\Z)', topic_content, re.DOTALL)
        if qb_match:
            qb_text = qb_match.group(1)
            # count questions based on bold items or list items.
            questions = re.findall(r'(\d+\.\s+\*\*.*?\*\*)', qb_text)
            q_count = len(questions)
            if q_count == 0:
                # alternate format
                questions = re.findall(r'(\*\s+\*\*.*?\*\*)', qb_text)
                q_count = len(questions)
        
        if q_count >= 10:
            report_lines.append(f"- {topic_title}: {q_count} questions (Pass)")
        else:
            report_lines.append(f"- {topic_title}: {q_count} questions (FAIL - expected 10-15)")
    
    # 2. URLs
    report_lines.append(f"\n### URL Check")
    urls = re.findall(r'https?://[^\s\)\>\]]+', content)
    unique_urls = set(urls)
    invalid_urls = []
    for url in list(unique_urls):
        url = url.rstrip('.,;') # remove trailing punctuation
        try:
            req = urllib.request.Request(url, headers=req_headers)
            urllib.request.urlopen(req, context=ctx, timeout=10)
        except Exception as e:
            invalid_urls.append((url, str(e)))
    
    if invalid_urls:
        report_lines.append("Invalid URLs found:")
        for u, e in invalid_urls:
            report_lines.append(f"  - {u} ({e})")
    else:
        report_lines.append("All URLs are valid and working.")
        
    # 3. Python contracts
    report_lines.append(f"\n### Python Contracts Check")
    blocks = re.findall(r'```python\n(.*?)\n```', content, re.DOTALL)
    contract_errors = []
    for i, block in enumerate(blocks):
        try:
            # We don't want to run malicious stuff, but exec should be fine for parsing
            # compile is safer if we just want to syntax check, but we need to execute them.
            # exec will actually run it.
            exec(block, {})
        except Exception as e:
            contract_errors.append((i, str(e)))
            
    if contract_errors:
        report_lines.append("Contract execution errors:")
        for idx, err in contract_errors:
            report_lines.append(f"  - Block {idx}: {err}")
    else:
        report_lines.append(f"All {len(blocks)} Python contracts executed successfully.")

    report_lines.append("\n---\n")

report_path = "/Users/onurseckinsenoglu/repos/dsa_visualizer/research/ml-infra-curriculum/next-research/agentic-runs/2026-08-20-curriculum-v8-uncapped-expansion/audits/validation-round2-domain-03-04.md"
with open(report_path, "w") as f:
    f.write("\n".join(report_lines))

print("Audit complete.")

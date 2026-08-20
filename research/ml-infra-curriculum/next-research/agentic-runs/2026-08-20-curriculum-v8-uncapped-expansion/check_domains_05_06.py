import re
import os
import urllib.request
import tempfile
import subprocess
import json

domains = ["rounds/round-01/domain-05-deep-learning-and-activations.md", "rounds/round-01/domain-06-tokenization-and-retrieval.md"]

report = {
    "topics": {},
    "url_errors": [],
    "contract_errors": []
}

for d in domains:
    with open(d, "r") as f:
        content = f.read()
    
    # Split by topic. A topic starts with something like `## Topic 19`
    topic_sections = re.split(r'(?=##\s+Topic\s+\d+)', content)
    
    for section in topic_sections:
        match = re.search(r'##\s+Topic\s+(\d+)', section)
        if not match:
            continue
        topic_num = match.group(1)
        
        # Count questions. Let's look for headers Part A, Part B, Part C, Part D
        # and then count list items `- ` or `* ` before the next header.
        parts = re.findall(r'####\s+Part\s+[A-D].*?(?=(?:####\s+Part\s+[A-D])|(?:###\s+)|(?:##\s+Topic)|\Z)', section, re.DOTALL)
        
        q_count = 0
        for part in parts:
            # count bullets that start with `- ` or `* ` or numbers like `1. `
            bullets = re.findall(r'^\s*(?:-|\*|\d+\.)\s+(.+)$', part, re.MULTILINE)
            q_count += len(bullets)
            
        report["topics"][topic_num] = q_count
        
        # Extract URLs
        urls = re.findall(r'https?://[^\s\)]+', section)
        for url in set(urls):
            # check url
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                resp = urllib.request.urlopen(req, timeout=5)
                if resp.getcode() >= 400:
                    report["url_errors"].append((topic_num, url, resp.getcode()))
            except Exception as e:
                report["url_errors"].append((topic_num, url, str(e)))
                
        # Extract python contracts
        blocks = re.findall(r'```python\n(.*?)\n```', section, re.DOTALL)
        for i, block in enumerate(blocks):
            # skip trivial blocks without 'def ' or 'class '
            if 'def ' not in block and 'class ' not in block:
                continue
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as tmp:
                tmp.write(block)
                tmp_name = tmp.name
                
            res = subprocess.run(["python3", tmp_name], capture_output=True, text=True)
            if res.returncode != 0:
                report["contract_errors"].append({
                    "topic": topic_num,
                    "error": res.stderr
                })
            os.remove(tmp_name)

print(json.dumps(report, indent=2))

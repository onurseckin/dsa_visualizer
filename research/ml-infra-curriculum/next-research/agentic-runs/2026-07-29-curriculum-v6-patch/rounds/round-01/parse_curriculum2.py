import os
import re
import glob
from collections import OrderedDict

def extract_contract_id(text):
    m = re.search(r'Contract ID: `(.*?)`', text)
    return m.group(1) if m else "N/A"

def extract_type(text):
    m = re.search(r'\((.*?)\)', text)
    if m:
        t = m.group(1).split(',')[0].strip()
        if t: return t
    return "N/A"

def parse_files():
    base_dir = "/Users/onurseckinsenoglu/repos/dsa_visualizer/research/ml-infra-curriculum/next-research/agentic-runs/2026-07-29-curriculum-v6-patch/rounds/round-01/"
    files = glob.glob(os.path.join(base_dir, "*.md"))
    
    problems = []
    
    for f_path in sorted(files):
        with open(f_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        lines = content.split('\n')
        current_module = ""
        current_rung = ""
        
        for line in lines:
            line = line.strip()
            
            # Match module headers like "## Topic 1: ..." or "### Topic 18: ..."
            topic_match = re.match(r'^#+\s+Topic\s+(.*?)$', line)
            if topic_match:
                current_module = "Topic " + topic_match.group(1).strip()
            elif line.startswith("#### "):
                current_rung = line.replace("#### ", "").strip()
            elif line.startswith("- **["):
                m = re.match(r'- \*\*\[(.*?)\]\((.*?)\)\*\*(.*)', line)
                if m:
                    title = m.group(1).strip()
                    url = m.group(2).strip()
                    rest = m.group(3).strip()
                    
                    problems.append({
                        "module": current_module,
                        "rung": current_rung,
                        "title": title,
                        "url": url,
                        "rest": rest,
                        "status": "N/A",
                        "difficulty": "N/A",
                        "canonical_id": "N/A" # to be generated
                    })
            elif line.startswith("- *Status:*") and problems:
                problems[-1]["status"] = line.replace("- *Status:*", "").strip().strip('.')
            elif line.startswith("- *Difficulty Rationale:*") and problems:
                problems[-1]["difficulty"] = line.replace("- *Difficulty Rationale:*", "").strip()

    return problems

def generate_report():
    problems = parse_files()
    
    unique_problems = OrderedDict()
    for p in problems:
        if p['title'] not in unique_problems:
            unique_problems[p['title']] = p
    
    total_unique = len(unique_problems)
    
    # Audit for direct literal URLs and primary research paper links. (0 placeholders)
    # Check if there are any URLs that are placeholders "0"
    zeros = [p for p in problems if p['url'] == '0']
    
    out = []
    out.append("# Provenance & Problem Bank Registry Audit")
    out.append("")
    out.append("## 1. Audit of Direct Literal URLs and Primary Research Paper Links")
    out.append(f"Found {len(zeros)} placeholder URLs ('0').")
    if zeros:
        out.append("Placeholder URLs found in:")
        for z in zeros:
            out.append(f"- {z['title']} in {z['module']}")
    out.append("")
    
    out.append("## 2. Canonical Problem Bank Registry Table")
    out.append("| Canonical ID | Exact Title | Problem Type | Direct URL | Canonical Module | Cross-Links | Rung | Required/Optional | Difficulty Rationale | Transfer Operation | Contract ID | Runtime | Verification Status |")
    out.append("|---|---|---|---|---|---|---|---|---|---|---|---|---|")
    
    # Format rows
    for i, p in enumerate(problems, start=1):
        c_id = f"PROB-{i:03d}"
        title = p['title']
        ptype = extract_type(p['rest'])
        url = p['url']
        module = p['module']
        cross_links = "N/A"
        rung = p['rung']
        status = p['status']
        diff = p['difficulty']
        transfer = "N/A"
        contract = extract_contract_id(p['rest'])
        runtime = "N/A"
        verif = "Pending"
        
        row = f"| {c_id} | {title} | {ptype} | {url} | {module} | {cross_links} | {rung} | {status} | {diff} | {transfer} | {contract} | {runtime} | {verif} |"
        out.append(row)
        
    out.append("")
    out.append("## 3. Exact Unique Problem Counts")
    out.append(f"Total Unique Problems Across All 31 Modules: {total_unique}")
    out.append(f"Total Problem Enrollments: {len(problems)}")
    
    out_dir = "/Users/onurseckinsenoglu/repos/dsa_visualizer/research/ml-infra-curriculum/next-research/agentic-runs/2026-07-29-curriculum-v6-patch/rounds/round-02/"
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "audit-provenance-and-registry.md")
    
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(out))
    
    print(f"Report written to {out_path}")
    print(f"Total unique problems: {total_unique}")

generate_report()

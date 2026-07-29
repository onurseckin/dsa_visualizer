import os
import re
import glob

# Columns: Canonical ID | Exact Title | Problem Type | Direct URL | Canonical Module | Cross-Links | Rung | Required/Optional | Difficulty Rationale | Transfer Operation | Contract ID | Runtime | Verification Status

def parse_files():
    base_dir = "/Users/onurseckinsenoglu/repos/dsa_visualizer/research/ml-infra-curriculum/next-research/agentic-runs/2026-07-29-curriculum-v6-patch/rounds/round-01/"
    files = glob.glob(os.path.join(base_dir, "*.md"))
    
    problems = []
    
    for f_path in sorted(files):
        with open(f_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Parse domains/topics
        lines = content.split('\n')
        current_module = ""
        current_rung = ""
        
        for line in lines:
            line = line.strip()
            if line.startswith("## Topic "):
                current_module = line.replace("## ", "").strip()
            elif line.startswith("#### "):
                current_rung = line.replace("#### ", "").strip()
            elif line.startswith("- **["):
                # Problem line
                # - **[Title](URL)** (Type, Contract ID: ...)
                # Try to extract the title and URL
                m = re.match(r'- \*\*\[(.*?)\]\((.*?)\)\*\*(.*)', line)
                if m:
                    title = m.group(1)
                    url = m.group(2)
                    rest = m.group(3).strip()
                    problems.append({
                        "module": current_module,
                        "rung": current_rung,
                        "title": title,
                        "url": url,
                        "rest": rest,
                        "status": "",
                        "difficulty": ""
                    })
            elif line.startswith("- *Status:*") and problems:
                problems[-1]["status"] = line.replace("- *Status:*", "").strip()
            elif line.startswith("- *Difficulty Rationale:*") and problems:
                problems[-1]["difficulty"] = line.replace("- *Difficulty Rationale:*", "").strip()

    return problems

problems = parse_files()
print(f"Total problems matched: {len(problems)}")
print(problems[:2])


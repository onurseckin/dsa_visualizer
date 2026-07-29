import re
import os

with open('research/ml-infra-curriculum/next-research/ORCHESTRATED-MASTER-CURRICULUM-V2.md', 'r') as f:
    lines = f.readlines()

topics = []
current_topic = None
topic_data = {}

for line in lines:
    topic_match = re.match(r'^# Topic (\w+): (.*)', line)
    if topic_match:
        topic_num = topic_match.group(1)
        topic_name = topic_match.group(2)
        current_topic = f"{topic_num}: {topic_name}"
        topics.append(current_topic)
        topic_data[current_topic] = {
            'links': [],
            'mechanisms': set()
        }
        continue
    
    # Mechanisms (e.g. Kahan, Reshape, etc.)
    if current_topic:
        links = re.findall(r'\[([^\]]+)\]\((https?://[^\)]+)\)', line)
        for title, url in links:
            if 'leetcode.com' in url or 'cses.fi' in url or 'deep-ml.com' in url or 'arxiv.org' in url:
                topic_data[current_topic]['links'].append((title, url))
        
        # very naive mechanism extraction just by looking at lines starting with bullet points for named mechanisms
        if 'Kahan' in line: topic_data[current_topic]['mechanisms'].add('Kahan/Welford')
        if 'Welford' in line: topic_data[current_topic]['mechanisms'].add('Kahan/Welford')
        if 'Reshape' in line: topic_data[current_topic]['mechanisms'].add('Reshape/Transpose')
        if 'Transpose' in line: topic_data[current_topic]['mechanisms'].add('Reshape/Transpose')
        if 'K Closest' in line: topic_data[current_topic]['mechanisms'].add('K Closest Points')
        if 'CSE' in line or 'Folding' in line or 'Liveness' in line: topic_data[current_topic]['mechanisms'].add('CSE/Folding/Liveness')


# Write the output file
out_dir = "research/ml-infra-curriculum/next-research/agentic-runs/2026-07-29-curriculum-v2-normalization/rounds/round-01"
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, "03-provenance-and-deduplication.md")

with open(out_path, 'w') as f:
    f.write("# Curriculum V2 Normalization - Source Verifier & Deduplication Auditor\n\n")
    f.write("## 1. Literal Direct URLs for All Topics\n\n")
    
    for t in topics:
        f.write(f"### Topic {t}\n")
        if topic_data[t]['links']:
            for title, url in topic_data[t]['links']:
                f.write(f"- [{title}]({url})\n")
        else:
            f.write("- No direct URLs found. (Will synthesize foundational links based on ML-infra equivalents)\n")
        f.write("\n")
        
    f.write("## 2. Canonicalization & Deduplication\n\n")
    f.write("### Deduplicated Questions and Mechanisms\n")
    f.write("- **Reshape/Transpose**\n")
    f.write("  - *Canonical Home*: Topic 01\n")
    f.write("  - *Downstream Cross-links*: Topic 02\n")
    f.write("- **Kahan/Welford**\n")
    f.write("  - *Canonical Home*: Topic 04\n")
    f.write("  - *Downstream Cross-links*: Topic 11, Topic 20\n")
    f.write("- **K Closest Points**\n")
    f.write("  - *Canonical Home*: Topic 14\n")
    f.write("  - *Downstream Cross-links*: Topic 15\n")
    f.write("- **CSE/Folding/Liveness**\n")
    f.write("  - *Canonical Home*: Topic 29\n")
    f.write("  - *Downstream Cross-links*: Topic 08\n")

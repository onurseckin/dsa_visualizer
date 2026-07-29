import re
from collections import defaultdict

with open('research/ml-infra-curriculum/next-research/ORCHESTRATED-MASTER-CURRICULUM-V2.md', 'r') as f:
    lines = f.readlines()

topics = []
current_topic = None
questions = defaultdict(list)

for line in lines:
    topic_match = re.match(r'^# Topic (\d+): (.*)', line)
    if topic_match:
        current_topic = topic_match.group(1) + ": " + topic_match.group(2)
        topics.append(current_topic)
        continue
    
    # Looking for markdown links to LeetCode, CSES, Deep-ML, etc.
    links = re.findall(r'\[([^\]]+)\]\((https?://[^\)]+)\)', line)
    for title, url in links:
        if 'leetcode.com' in url or 'cses.fi' in url or 'deep-ml.com' in url or 'arxiv.org' in url or 'papers' in url:
            if current_topic:
                questions[url].append((title, current_topic))

print(f"Total Topics: {len(topics)}")

dup_count = 0
for url, occurrences in questions.items():
    if len(occurrences) > 1:
        dup_count += 1
        print(f"Duplicate URL: {url}")
        for title, topic in occurrences:
            print(f"  - {title} in {topic}")

with open('research/ml-infra-curriculum/next-research/agentic-runs/2026-07-29-curriculum-v2-normalization/rounds/round-01/03-provenance-and-deduplication.md', 'w') as f:
    f.write("# Provenance and Deduplication\n\n")
    f.write("## 1. Canonicalization & Deduplication\n\n")
    # write dedup logic here

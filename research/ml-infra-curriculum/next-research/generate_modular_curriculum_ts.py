#!/usr/bin/env python3
"""
Modular 10-Domain Machine Learning Curriculum Synthesizer
Splits into <= 2 topics per file, ensuring 200-360 lines per file (strictly <= 500 lines under oxfmt)
"""

import json
import os
import sys

sys.path.insert(0, 'research/ml-infra-curriculum/next-research')
from synthesize_complete_ml_database import get_full_topics

def write_modular_files():
    topics = get_full_topics()
    assert len(topics) == 41, f"Expected 41 topics, found {len(topics)}"
    
    # Strictly <= 2 topics per file to guarantee line count < 400 with oxfmt
    modules = [
        ("domain01_part1.ts", "domain01_part1", topics[0:2]),    # Topics 01-02
        ("domain01_part2.ts", "domain01_part2", topics[2:4]),    # Topics 03-04
        ("domain02_part1.ts", "domain02_part1", topics[4:6]),    # Topics 05-06
        ("domain02_part2.ts", "domain02_part2", topics[6:8]),    # Topics 07-08
        ("domain03_part1.ts", "domain03_part1", topics[8:10]),   # Topics 09-10
        ("domain03_part2.ts", "domain03_part2", topics[10:12]),  # Topics 11-12
        ("domain04_part1.ts", "domain04_part1", topics[12:14]),  # Topics 13-14
        ("domain04_part2.ts", "domain04_part2", topics[14:16]),  # Topics 15-16
        ("domain04_part3.ts", "domain04_part3", topics[16:18]),  # Topics 17-18
        ("domain05_part1.ts", "domain05_part1", topics[18:20]),  # Topics 19-20
        ("domain05_part2.ts", "domain05_part2", topics[20:22]),  # Topics 21-22
        ("domain05_part3.ts", "domain05_part3", topics[22:23]),  # Topic 23
        ("domain06_part1.ts", "domain06_part1", topics[23:25]),  # Topics 24-25
        ("domain06_part2.ts", "domain06_part2", topics[25:27]),  # Topics 26-27
        ("domain07_part1.ts", "domain07_part1", topics[27:29]),  # Topics 28-29
        ("domain07_part2.ts", "domain07_part2", topics[29:30]),  # Topic 30
        ("domain08_part1.ts", "domain08_part1", topics[30:32]),  # Topics 31-32
        ("domain08_part2.ts", "domain08_part2", topics[32:33]),  # Topic 33
        ("domain09_part1.ts", "domain09_part1", topics[33:35]),  # Topics 34-35
        ("domain09_part2.ts", "domain09_part2", topics[35:36]),  # Topic 36
        ("domain10_part1.ts", "domain10_part1", topics[36:38]),  # Topics 37-38
        ("domain10_part2.ts", "domain10_part2", topics[38:39]),  # Topic 39
        ("domain10_part3.ts", "domain10_part3", topics[39:41]),  # Topics 40-41
    ]
    
    target_dir = "src/curriculum/mlQuestions"
    
    # Clean up old files
    for existing in os.listdir(target_dir):
        if existing not in ["types.ts"] and existing.endswith(".ts"):
            os.remove(os.path.join(target_dir, existing))
            
    # Write each modular file
    import_statements = []
    array_names = []
    
    for filename, export_name, topic_subset in modules:
        filepath = os.path.join(target_dir, filename)
        content = f'import type {{ MLTopicQuestionBank }} from "./types";\n\n'
        content += f'export const {export_name}: MLTopicQuestionBank[] = ' + json.dumps(topic_subset, indent=2) + ';\n'
        with open(filepath, "w") as f:
            f.write(content)
            
        import_statements.append(f'import {{ {export_name} }} from "./{filename[:-3]}";')
        array_names.append(export_name)
        
    # Write index.ts
    index_content = """import type { MLTopicQuestionBank } from "./types";
""" + "\n".join(import_statements) + f"""

export const ML_QUESTION_BANKS: Record<string, MLTopicQuestionBank> = {{}};

const allBanks: MLTopicQuestionBank[] = [
  {",\n  ".join(f"...{arr}" for arr in array_names)}
];

for (const bank of allBanks) {{
  ML_QUESTION_BANKS[bank.topicId] = bank;
}}

export function getMlTopicQuestionBank(topicId: string): MLTopicQuestionBank {{
  const bank = ML_QUESTION_BANKS[topicId];
  if (!bank) {{
    throw new Error(`MLTopicQuestionBank not found for topicId: ${{topicId}}`);
  }}
  return bank;
}}

export * from "./types";
"""
    with open(os.path.join(target_dir, "index.ts"), "w") as f:
        f.write(index_content)
        
    print("Successfully generated all ultra-modular question bank files and index.ts!")

if __name__ == "__main__":
    write_modular_files()

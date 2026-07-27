import re

with open('src/components/trivia/components/DeckGroupCollapsible.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'className="w-full min-w-0 shadow-sm"',
    'className="w-full min-w-0 border border-[var(--border-subtle)] rounded-[var(--radius-lg)] overflow-hidden shadow-sm"'
)

with open('src/components/trivia/components/DeckGroupCollapsible.tsx', 'w') as f:
    f.write(content)


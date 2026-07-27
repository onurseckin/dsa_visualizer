import re

# 1. SearchTrigger.tsx
with open('src/components/SearchTrigger.tsx', 'r') as f:
    content = f.read()
content = content.replace(
    'className="flex items-center gap-3 w-72 px-4 py-2 border rounded-[var(--radius-md)] font-[var(--font-ui)] cursor-pointer whitespace-nowrap shrink-0 transition-colors shadow-sm focus-visible:outline-none"',
    'className="flex items-center gap-3 w-72 px-5 py-2.5 border rounded-[var(--radius-md)] font-[var(--font-ui)] cursor-pointer whitespace-nowrap shrink-0 transition-colors shadow-sm focus-visible:outline-none"'
)
with open('src/components/SearchTrigger.tsx', 'w') as f:
    f.write(content)

# 2. ProblemDescriptionCard.tsx
with open('src/components/primitives/ProblemDescriptionCard.tsx', 'r') as f:
    content = f.read()
content = content.replace(
    '      <div className="flex items-center flex-wrap gap-3 py-3 px-4 bg-[var(--bg-inset)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">\n        <h1 className="m-0 text-xl font-bold text-[var(--text-primary)] nowrap overflow-hidden text-ellipsis">',
    '      <div className="flex items-center flex-wrap gap-3 py-4 px-6 bg-[var(--bg-inset)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">\n        <h1 className="m-0 text-xl font-bold text-[var(--text-primary)] nowrap overflow-hidden text-ellipsis">'
)
content = content.replace(
    '''          <section>
            <FieldLabel label="Problem" />
            <p className="m-0 text-sm leading-relaxed text-[var(--text-secondary)]">
              {description}
            </p>
          </section>''',
    '''          <section>
            <FieldLabel label="Problem" />
            <Well padding="md" className="mt-2">
              <p className="m-0 text-sm leading-relaxed text-[var(--text-secondary)]">
                {description}
              </p>
            </Well>
          </section>'''
)
content = content.replace(
    '''          {constraints && constraints.length > 0 && (
            <section>
              <FieldLabel label="Constraints" />
              <ul className="m-0 pl-4 font-mono text-xs leading-relaxed text-[var(--text-secondary)]">
                {constraints.map((constraint, idx) => (
                  <li key={`constraint-${idx}`}>{constraint}</li>
                ))}
              </ul>
            </section>
          )}''',
    '''          {constraints && constraints.length > 0 && (
            <section>
              <FieldLabel label="Constraints" />
              <Well padding="md" className="mt-2">
                <ul className="m-0 pl-4 font-mono text-xs leading-relaxed text-[var(--text-secondary)]">
                  {constraints.map((constraint, idx) => (
                    <li key={`constraint-${idx}`}>{constraint}</li>
                  ))}
                </ul>
              </Well>
            </section>
          )}'''
)
with open('src/components/primitives/ProblemDescriptionCard.tsx', 'w') as f:
    f.write(content)

# 3. SolutionApproachCard.tsx
with open('src/components/primitives/SolutionApproachCard.tsx', 'r') as f:
    content = f.read()
content = content.replace(
    '      <div className="flex items-center flex-wrap gap-3 py-3 px-4 bg-[var(--bg-inset)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">\n        <h2 className="m-0 text-xl font-bold text-[var(--text-primary)]">Solution approach</h2>',
    '      <div className="flex items-center flex-wrap gap-3 py-4 px-6 bg-[var(--bg-inset)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">\n        <h2 className="m-0 text-xl font-bold text-[var(--text-primary)]">Solution approach</h2>'
)
content = content.replace(
    '          className="mt-6 pt-6 border-t border-[var(--border-default)] px-2 flex flex-col gap-6"',
    '          className="mt-6 pt-6 border-t border-[var(--border-default)] px-2 flex flex-col gap-6 pb-6 border-b"'
)
with open('src/components/primitives/SolutionApproachCard.tsx', 'w') as f:
    f.write(content)

# 4. AuxiliaryPanel.tsx
with open('src/components/primitives/AuxiliaryPanel.tsx', 'r') as f:
    content = f.read()
content = content.replace(
    '      <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">',
    '      <div className="flex items-center gap-2 pb-4 mb-2 border-b border-[var(--border-subtle)]">'
)
content = content.replace(
    '      <div className="flex flex-col gap-3.5">',
    '      <div className="flex flex-col gap-3.5 px-2">'
)
with open('src/components/primitives/AuxiliaryPanel.tsx', 'w') as f:
    f.write(content)

# 5. DeckGroupCollapsible.tsx
with open('src/components/trivia/components/DeckGroupCollapsible.tsx', 'r') as f:
    content = f.read()
content = content.replace(
    '      className="w-full min-w-0 border border-[var(--border-subtle)] rounded-[var(--radius-md)] overflow-hidden shadow-sm"',
    '      className="w-full min-w-0 shadow-sm"'
)
with open('src/components/trivia/components/DeckGroupCollapsible.tsx', 'w') as f:
    f.write(content)

# 6. ui.css
with open('src/styles/ui.css', 'r') as f:
    content = f.read()
content = content.replace(
    '  border-radius: var(--radius-sm);\n  font-family: var(--font-ui);\n  font-size: var(--text-xs);\n',
    '  border-radius: var(--radius-full);\n  font-family: var(--font-ui);\n  font-size: var(--text-xs);\n'
)
# Let's also check if there's an explicit white border we should remove.
# The user asked for "subtle borders, instead of harsh white outlines".
# Let's ensure that ui-badge--* border-colors are not harsh white or are transparent if they were harsh.
# In the original ui.css:
# .ui-badge--neutral has `border-color: var(--border-subtle);` (which is already subtle)
# Wait, maybe there's a different place with "harsh white borders"?
with open('src/styles/ui.css', 'w') as f:
    f.write(content)


# Mantine as the only UI and styling system

The site moves from hand-written plain CSS to Mantine (core, hooks, form) for every page, admin and storefront, with no Tailwind. The Mantine theme carries the current colors, font and radius, so the look stays the same while boxes and forms become consistent.

We chose it over Tailwind v4 + shadcn, the usual stack in the owner's other projects, because this shop needs one theme that keeps every form and box alike, plus ready right-to-left components (autocomplete, creatable brand picker, select, form validation), with little code of our own to maintain. shadcn copies component source into the repo, so updates are manual, and its CLI brings a dependency tree with open audit warnings. Mantine updates through npm and passes through the supply-chain audit like any other dependency.

## Consequences

- Mantine and Tailwind do not mix well, so Tailwind stays out of this repo.
- The site depends on a small core team at Mantine. If the project stalls, moving off it means rewriting components.

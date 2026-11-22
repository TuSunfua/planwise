# 0010: Build UI primitives with shadcn/ui

- **Status:** Accepted
- **Date:** 2026-11-22

## Context

The app needs accessible primitives such as dialogs, menus and popovers. shadcn/ui copies their source into the
repository, but expects its own token names. Two clashed with the theme: `muted` was secondary text and `accent`
was progress green, while shadcn uses both as fills. Its `init` also writes a `lib/utils.ts`, which the code
conventions ban, a Geist font and a gray palette.

## Decision

- Use shadcn/ui with Base UI, the `nova` style and Lucide icons. Components live in `components/ui/`.
- Use shadcn's token names with the Daybreak and Nightfall values. [The theme](../brand/theme.md) owns both.
- Import `cn` from the `cn` package. `components.json` points its `utils` alias there, so there is no `lib/utils.ts`.
- Don't install shadcn's packages up front. Its CLI runs as `npx shadcn@4.23.0`, its stylesheet is copied to
  `styles/shadcn.css`, and Base UI, `class-variance-authority`, `cn` and Lucide arrive with the first component
  that imports them. Only `tw-animate-css`, which the stylesheet setup needs, is a dev dependency.
- Keep `rtl` on in `components.json`, so the CLI writes logical classes.
- Add a component when a feature needs it. Don't run `init` again: it would undo the points above.

## Alternatives

- **Keep the theme's token names:** every added or updated component would need its classes rewritten.
- **The stock palette:** off-brand, and its focus ring fails WCAG 2.2 AA.
- **Primitives written by hand:** fewer dependencies, but focus, keyboard and screen reader behavior would be ours
  to build and maintain.

## Consequences

- Components work with the theme as downloaded, but still need the
  [theme's review](../brand/theme.md#adding-a-shadcn-component) for accessibility and shape.
- Component source and the stylesheet are ours to maintain; updates are merged by hand.
- The CLI installs `cn` but not the other packages: the type check names what is missing.
- Each component's client JavaScript and server render time count against the Free plan, so check both in workerd.

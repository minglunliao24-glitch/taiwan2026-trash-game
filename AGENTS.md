<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Game architecture
- Keep the official site at `/` and the client-only game at `/game`; the lobby must be the initial game view.
- Use R3F with one scene stepper; simulation and editor validation stay in pure TypeScript under `src/game/sim` so movement and rules can be tested without WebGL.
- Store demo profile, settings and explicitly saved maps in versioned local storage only; never connect a backend for this prototype.
- Keep scene material colors in `--scene-*` CSS tokens and UI colors in semantic theme tokens so art direction is centralized.
- The deliberately voxel avatar and generated voxel groves use original geometry; no Roblox assets or logos are allowed.
- Dev-only `window.__game` exposes live `state`, `controls`, `sim(seconds)` and `jump()` for deterministic checks; `[data-scene-ready="1"]` signals the first real scene frame.

## Website CMS architecture
- Website administration is separate from the local-only game: use authenticated server functions and database admin-role checks for all content operations so public visitors cannot mutate content.
- Store roles independently from profiles; first admin bootstrap requires a confirmed account matching server-only ADMIN_BOOTSTRAP_EMAIL and an atomic service-only one-time database function to prevent public self-promotion.
- Keep covers in a private bucket with published-content or admin read policies; never expose draft image URLs through a public bucket.
- Public homepage content queries use an anonymous server client and published-only policies; show explicit errors rather than substitute invented content when reads fail.

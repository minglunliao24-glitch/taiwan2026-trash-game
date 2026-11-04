# Playable game MVP
- [x] Add independent single-player sandbox entrance and playable exploration/building HUD without changing arcade or CMS.
- [x] Verify sandbox persistence, reset, desktop controls, mobile layout and WebGL fallbacks.
- [x] Add local garbage-sorting arcade at /game with lobby, timed rounds, combo scoring, keyboard/touch controls and results.
- [x] Connect homepage trial entrance without changing CMS, authentication or database configuration.
- [x] Verify arcade rules, complete desktop/mobile round and inspect current build diagnostics.
- [x] Preserve website and link game entrance to /game lobby.
- [x] Build touch/keyboard island exploration with avatar, jumping and camera.
- [x] Build local grid editor, preview, profile and settings.
- [x] Verify rules, public-to-game flow and desktop/mobile rendering.
The arcade remains at /game; shared legacy island rendering now powers the independent /sandbox single-player building test.

# Website administration
Prior CMS completion and authenticated verification remain deferred by the user's explicit instruction not to change the backend this round.
- [x] Confirm whether administrator profile fields are needed before authentication implementation: no profile fields.
- [ ] Add secure administrator sign-in and role authorization at /admin without changing the game.
- [ ] Create content tables, published-only read policies, admin CRUD policies and protected image uploads.
- [ ] Build overview and announcement, release and event management with draft/publish/pin, search and category filters.
- [ ] Connect homepage to published content while preserving its design and existing announcements.
- [ ] Verify authorization, database policies, authenticated CRUD and desktop/mobile interaction; document initial admin authorization.
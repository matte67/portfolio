# Portfolio content checklist

Information confirmed for the public launch on 17 July 2026 is marked complete. Remaining items are optional future evidence or content improvements.

## Global

- [x] Removed unavailable LinkedIn placeholders; LinkedIn will only be restored with a verified profile URL.
- [x] Confirmed `matteo01.vittori@icloud.com` as the public contact address.
- [x] Confirmed Netlify deployment at `https://matteo-vittori.netlify.app/`.
- [x] Added final Open Graph and social preview metadata and imagery.
- [x] No portfolio analytics for the initial launch; this avoids unnecessary tracking and consent UI.
- [ ] Update the CV biography, which still references interest in EPFL.
- [x] Interface and project case studies available in English and Italian.
- [ ] Move language selection into localized URLs before indexing Italian content separately.

## SEF

- [x] Public source repository: `https://github.com/matte67/SEF`.
- [x] Documentation: `https://matte67.github.io/SEF/`.
- [x] Contribution split: Matteo led architecture, core, runtime, CLI, interfaces, and documentation; Alejandro focused primarily on concrete plugins.
- [x] Benchmark basis: synthetic NumPy frames, MacBook M2 with 8 GB RAM, ten measured repetitions after warm-up, median result; raw data and commands are in the repository.
- [x] Runtime support: Python 3.11+, tested on macOS and Windows.
- [x] Licence: Apache 2.0 with Commons Clause License Condition v1.0; licensors Alejandro Innocenzi, Matteo Vittori, and Michele Loreti.
- [x] Current status: experimental pre-1.0, preparing a stable release and seeking adopters, including ENEA-related structural monitoring work.
- [x] Verified that `pypi.org/project/sef` still exposes the unrelated legacy 0.9 release from 2013; no PyPI link or installation claim is published until the package identity is corrected.
- [ ] Provide short recordings of a real CLI run and SEF Studio workflow if they should appear in the case study.

## UniStays

- [x] Confirmed as an independent project.
- [x] Confirmed private beta status.
- [x] Repository is intentionally private and is no longer presented as a public link.
- [x] The Netlify deployment is a preview, not the final public deployment.
- [ ] Add real usage, user-testing, moderation, or performance evidence when available.
- [ ] Document the deployed architecture and data model in more detail.
- [x] Publication rights for apartment and listing imagery confirmed by Matteo.
- [ ] Confirm the exact start date if the current `2025—26` duration should be more precise.

## RE:WILD

- [x] Clearly labelled as a concept based only on a pitch and GDD, with no playable implementation claimed.
- [x] Confirmed as entirely designed by Matteo.
- [ ] Export `REWILD_GDD.pages` to PDF for browser access.
- [ ] Confirm the exact project start date or duration if needed.
- [ ] Document the hypothetical immersive-room hardware, software stack, and touch system if the design is developed further.
- [ ] Add classroom, educator, museum, or learning-outcome validation only if testing takes place.
- [x] Publication and commercial-use rights for all game artwork confirmed by Matteo.

## HackHub — Hackathon Management System

- [x] Public repository: `https://github.com/matte67/HackHub`.
- [x] Confirmed Software Engineering course context.
- [x] Confirmed authors: Matteo Vittori and Alejandro Innocenzi.
- [x] Confirmed Java 21, Spring Boot 3, H2, local OpenAPI/Swagger, frontend demo, event-driven scheduling, and MIT licence from the repository README.
- [x] Added the available architecture image and frontend link.
- [ ] Add original use-case, class, and sequence diagrams if they should be shown in the case study.
- [ ] Add an ERD or detailed domain model diagram.
- [ ] Add representative OpenAPI request/response examples or a hosted backend API.
- [ ] Add screenshots of the testing frontend beyond the current hero asset.
- [ ] Add automated test, coverage, or quality results.
- [ ] Confirm Matteo's exact contribution split and the course-project duration if more precision is desired.

## Dormant Access Control Unit

- [x] Added as a fifth case study with architecture, operating logic, modules, interrupt map, timing parameters, trade-offs, and both Wokwi simulations.
- [x] Energy efficiency is described as an architectural goal, not a measured result.
- [ ] Confirm the inferred `2024—25` year, independent-team attribution, and academic-project duration.
- [ ] Add a source repository if it should be public.
- [ ] Add physical prototype photos or measurements if hardware was built outside Wokwi.
- [ ] Add measured current draw or battery-life results before making quantitative energy-saving claims.

## Thesis

- [x] Confirmed the supplied 89-page PDF as the publication version.
- [ ] Provide an official abstract if it should replace the current editorial summary.
- [x] Public-hosting and direct-download permissions confirmed for the thesis.
- [ ] Add thesis repository, defence date, result, DOI, or publication link if applicable.
- [ ] Add a tagged-text accessible version; the current PDF/A-2b file is not tagged.

## Final launch review

- [x] Removed visible “add link”, “export needed”, and content-checkpoint blocks from project pages.
- [ ] Check every external URL after deployment.
- [x] Generated final social preview and production metadata for the confirmed Netlify domain.
- [x] `npm run lint`, `npm run build`, and all seven Playwright end-to-end tests pass locally.

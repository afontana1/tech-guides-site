# Tech Guides

A concept-driven learning library for Python, mathematics, data science, machine learning, neural networks, and software engineering.

Site URL after deployment: **https://afontana1.github.io/tech-guides-site/**

The site includes full-text search, cross-topic concept pages, topic browsing, suggested learning paths, related guides, syntax-highlighted code, mathematical notation, and a light/dark theme. It is built with Astro and Pagefind and served as a static site on GitHub Pages.

## Local development

Use Node.js 22 LTS. On Windows PowerShell, use `npm.cmd` if the execution policy blocks `npm.ps1`.

```sh
npm install
npm run dev
```

The development server serves the site under `/tech-guides-site/`. Title, summary, and concept search have a fallback in development; the full-text index is generated during a production build.

```sh
npm test
npm run build
npm run validate
npm run preview
```

For the production browser checks, run `npx playwright install chromium`, then `npm run test:e2e` after building. These exercise real full-text search, aliases, combined filters, navigation, and the mobile layout. CI runs them before deployment.

Use the preview URL with `/tech-guides-site/` appended to test the production build, including full-text search.

Commit the generated `package-lock.json` after installing dependencies so local and CI builds use the same versions. The workflow uses `npm ci` when a lockfile is present.

## Publishing to GitHub Pages

1. Push this project, including the Markdown directories, to `afontana1/tech-guides-site` on the `main` branch.
2. In the repository's **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source. This is a one-time repository setting.
3. The **Build and deploy Tech Guides** workflow runs tests, builds the site and search index, checks generated pages and links, and deploys the artifact to GitHub Pages.
4. Open the workflow's deployment URL after it succeeds.

Future pushes to `main` publish updates automatically. Pull requests run the build and checks without deploying. The workflow can also be started manually from the Actions tab.

If this folder is being connected to a remote that already has an initial README commit, fetch and merge that history before pushing. Do not force-push over the existing remote history.

On Windows, the publishing helper installs dependencies, runs the checks, connects to the existing remote history, commits the site, and pushes normally:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/publish.ps1
```

The execution-policy option applies only to this command's PowerShell process. The helper preserves the remote's initial commit and stops if existing local and remote histories have diverged. It does not force-push. The one-time Pages setting above is still required.

## Adding and editing guides

Keep editing the original Markdown files in their topic folders. The build reads these folders directly; the site does not require moving them into `src/` or adding frontmatter to every file. New Markdown files are included automatically on the next build.

The original files remain unchanged. During rendering, the site turns `Slide 1: …` lines into section headings, adds anchor links, highlights fenced code, renders math, and rewrites recognized relative Markdown links to their published pages. Fenced `mermaid` blocks become interactive-page SVG diagrams, rendered as they approach the viewport. They follow the light/dark theme and retain a collapsible source view. Mermaid is bundled with the site, so diagram rendering does not depend on a third-party CDN.

The source content includes tutorials and examples with differing scopes. Generated summaries and topic matching aid discovery; they are not a technical review of every tutorial.

## Maintaining concepts and navigation

- `src/data/topics.mjs` defines the top-level subject areas and suggested learning paths.
- `src/data/concepts.mjs` defines concept names, descriptions, aliases, and relevance patterns. These connect related guides across folders.
- `metadataOverrides` in that file can correct a displayed title, add a summary, select explicit concept IDs, or show a note without editing the original Markdown. An override is keyed by the source file's relative path.
- `src/lib/library.mjs` creates guide metadata, URL slugs, summaries, reading estimates, and related-guide links.

Search covers titles, concept names and aliases, explanations, and code. Topic, format, and concept filters can be combined. Search is based on text and curated aliases, rather than embedding-based semantic retrieval. The build lowers the search weight of code blocks so repeated boilerplate has less influence.

## Project files

```text
original-topic-folders/        Markdown source of truth
src/data/                     Topic, concept, and learning-path catalog
src/lib/                      Content discovery and safe Markdown rendering
src/pages/                    Home, search, concepts, topics, paths, and guides
src/styles/                   Responsive light/dark site styling
tests/                        Content and Markdown-rendering tests
scripts/validate-site.mjs      Production output and link checks
.github/workflows/deploy.yml   Build, validation, and GitHub Pages deployment
```

`astro.config.mjs` sets the GitHub Pages domain and `/tech-guides-site` base path. Change both if the repository or hosting location changes.

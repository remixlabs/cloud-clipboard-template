# cloudclipboard
Cloudflare workers to manage access and provide read/write to PlanetScale databases holding clipboard tables

Instructions:

1. <code>npm install</code>
2. If testing locally, create a <code>.dev.vars</code> file and set the necessary values to connect to the PlanetScale db <code>testing</code> branch
    - Run <code>npm run dev</code> scripts
3. If testing a deployed worker, create a <code>dev-config.json</code> and set the necessary values to connect to the PlanetScale db <code>testing</code> branch
    - Run <code>npm run dev-publish</code> scripts
4. On merge into main, production versions of the workers are re-deployed


# cloud-clipboard-template
Template repo to generate PlanetScale database and Cloudflare worker for your personal cloud clipboard

Instructions:

1. Create a PlanetScale account and a Cloudflare account at https://auth.planetscale.com/sign-up and https://dash.cloudflare.com/sign-up
2. Create a template from this repo
3. Set your Github Actions secrets
    - PSCALE_ORG_NAME (name of organization you created on PlanetScale, or the auto-generated name PlanetScale provides if no organization specified)
    - PSCALE_DB_NAME (name of your database and worker)
    - CF_ACCOUNT_ID (Cloudflare account id, which can be found on the <i>Overview</i> page of your account)
    - CF_API_TOKEN (generate this at https://dash.cloudflare.com/profile/api-tokens by clicking the <i>Create token</i> button and using the <i>Edit Cloudflare Workers</i> template provided)
4. Go to the <i>Actions</i> tab and manually run the workflow named <i>Create Database and Deploy Worker</i>
5. Select the running workflow and select the step named <i>Create database - please click on displayed link to authenticate</i>
6. Wait for a prompt to click a link that will authenticate your account with the PlanetScale CLI
7. Wait a few minutes for your fully deployed and initialized PlanetScale database and Cloudflare worker

If testing (after initial instruction steps are completed) :

1. <code>npm install</code>
2. If testing locally, create a <code>.dev.vars</code> file and set the necessary values to connect to your PlanetScale database branch
    - Check out https://planetscale.com/docs/onboarding/connect-to-your-database for help
    - Change the <i>Connect with</i> selected option to <i>@planetscale/database</i>
    - Copy the database connection into your <code>.dev.vars</code> file
    - Run <code>npm run dev</code>
3. If testing a deployed worker, create a <code>dev-config.json</code> and set the necessary values from the above step
    - Run <code>npm run dev-publish</code>
4. On merge of your changes into the main branch, your PlanetScale database and Cloudflare worker are re-deployed
    - IMPORTANT: make sure to authenticate with PlanetScale in the workflow step after merge


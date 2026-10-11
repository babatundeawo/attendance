# Deploying and updating the register

Everything happens on the GitHub website. You never need to install anything or type commands.

## How deployment works

Every time a change is saved to the `main` branch, GitHub automatically checks the code, builds the site and publishes it. This is called a **workflow**. You can watch it in the **Actions** tab.

A change reaches the live site only when it is **merged into `main`**. Until then the live site is untouched.

## One-time rollout of the new design

### 1. Put the new files on a separate branch

A **branch** is a safe copy of the project where changes can be tried without affecting the live site.

1. Unzip the delivered folder on your computer. Make sure hidden files are visible (Windows: **View > Show > Hidden items**; Mac: press `Cmd + Shift + .`) so the `.github` folder is included.
2. Open <https://github.com/babatundeawo/attendance>.
3. Click the branch menu (it says **main**), type `rebrand/premium-redesign`, and click **Create branch: rebrand/premium-redesign from main**.
4. Click **Add file > Upload files**.
5. Drag **everything inside** the unzipped folder (all files and folders) into the page and wait for the uploads to finish.
6. Under **Commit changes**, choose **Commit directly to the `rebrand/premium-redesign` branch** and click **Commit changes**.
7. Delete three old files that the new version no longer uses. On the branch, open each of `manifest.json`, `service-worker.js` and `icon.svg` **in the main folder** (not the ones inside `public`), click the **trash can** icon, and commit to the same branch.

### 2. Open the pull request

1. Click **Contribute > Open pull request** (or the yellow **Compare & pull request** banner).
2. Click **Create pull request**.
3. Wait a minute or two. At the bottom of the page the **Deploy** checks run.

A green tick means the code passed its checks. A red cross means something needs fixing (see "How to read an error" below).

### 3. Look at the new site before it goes live

Open the pull request's **Checks** tab, click the **Deploy** run, scroll to **Artifacts** and download `site-preview`. It is a zip of the finished site. (GitHub Pages cannot show a live preview of a pull request, so the live check happens in the next step.) If you want a second pair of eyes, send a teacher the screenshots in the pull request description.

### 4. Switch on GitHub Pages deployment (once)

1. Go to **Settings > Pages**.
2. Under **Build and deployment > Source** choose **GitHub Actions**.

### 5. Finish login setup, then merge

1. Follow `FIREBASE_LOGIN_SETUP.md` through **Step 7** (the six secrets must exist before merging).
2. On the pull request click **Merge pull request**, then **Confirm merge**.
3. Open the **Actions** tab. **You should see** a run called **Deploy** with a spinning yellow dot, then a **green tick** after a few minutes.
4. Open your site at <https://babatundeawo.github.io/attendance/>. **You should see** the Sign in page.
5. Do **Step 8** of the login guide (publish the database rules), then follow its **How to test that login works** section.

### To cancel instead

On the pull request, scroll down and click **Close pull request**. Nothing changes on the live site.

## Everyday updates

- **Change a small piece of text or a setting:** open the file in the repository, click the **pencil** icon, edit, click **Commit changes**. Choose **Create a new branch and start a pull request** if you want to check it first, or commit straight to `main` for a quick fix. The workflow then deploys it.
- **Start a new term:** see `CUSTOMIZING.md`, "Term dates".
- Students, attendance and holidays are changed inside the app itself, not in GitHub.

## How to check whether a deployment worked

1. Open the **Actions** tab.
2. Look at the top run called **Deploy**. A **green tick** means published. A **red cross** means it failed. A **yellow dot** means it is still running.

## How to read an error

1. Click the red run, then click the step marked with a red cross (for example **Check and build**).
2. The step opens. Scroll to the lines in red; the first red line is usually the cause.
3. Common causes:
   - **"Firebase settings missing"**: one of the six secrets is not set. See `FIREBASE_LOGIN_SETUP.md`, Step 7.
   - **Lint or test errors** after you edited a file: the edit has a typo. Open the file named in the error and fix it.
   - **"Resource not accessible" at the Publish step**: GitHub Pages is not switched to **GitHub Actions** (see step 4 above).

## How to roll back to an earlier version

Every version is kept in GitHub.

1. Open the **Pull requests** tab, then **Closed**, and click the pull request you want to undo.
2. Scroll to the bottom and click **Revert**. GitHub prepares a new pull request that undoes it.
3. Click **Create pull request**, wait for the green tick, then **Merge pull request**.
4. The workflow publishes the earlier version again.

## Using your own domain name (optional)

1. Buy or use a domain, then in **Settings > Pages > Custom domain** type it and click **Save**.
2. At your domain provider add the DNS records GitHub shows on that page (for a subdomain such as `register.myschool.org`, a **CNAME** record pointing to `babatundeawo.github.io`).
3. In **Settings > Secrets and variables > Actions > Variables** click **New repository variable**, set **Name** to `BASE_PATH` and **Value** to `/`, then run **Actions > Deploy > Run workflow**.
4. Add the domain to Firebase **Authorized domains** (`FIREBASE_LOGIN_SETUP.md`, Step 3).

## Turn on GitHub's automatic security checks

1. **Settings > Code security** (or **Advanced Security**).
2. Switch on **Dependabot alerts**, **Dependabot security updates** and **Secret scanning** (and **Push protection** if offered). Secret scanning warns you if a password or key is ever added to the repository by mistake.
3. The included CodeQL scan runs on its own; results appear under **Security > Code scanning**.

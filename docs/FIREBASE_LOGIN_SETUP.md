# Setting up login (Firebase), step by step

This guide is for the person who looks after the register. You do not need any technical background and you do not need to type any commands. You only use two websites: the **Firebase Console** and **GitHub**.

## What is being set up?

The register holds students' names, dates of birth, parents' phone numbers and addresses. Until now anyone who knew the web address could open it. Now the register asks for an **email and password**, and the database itself refuses anyone who is not on a **staff list**.

**Firebase Authentication** is Google's sign-in service. It stores the emails and passwords safely, so the register never sees a password.

You will do these things:

1. Open your Firebase project
2. Turn on email-and-password sign-in
3. Allow the website address
4. Create your own login
5. Put yourself on the staff list
6. Copy the project's settings
7. Add the settings to GitHub
8. Publish the new database rules
9. Test it

> **Order matters.** Do the steps in the order shown. In particular, do **Step 8 (publish the rules) only after the new site is live** (see `DEPLOYMENT.md`). The old version of the site has no login, so it stops working the moment the rules are published.

---

## Step 1: Open your Firebase project

1. Go to <https://console.firebase.google.com> and sign in with the Google account that owns the project.
2. Click the project named **class-attendance-c5494**.

**You should see:** the project's home page with a menu on the left (Build, Run, Analytics and so on).

## Step 2: Turn on email-and-password sign-in

1. In the left menu click **Build**, then **Authentication**.
2. If you see a **Get started** button, click it.
3. Open the **Sign-in method** tab.
4. Click **Email/Password**.
5. Switch **Enable** on (the first switch only; leave "Email link" off).
6. Click **Save**.

**You should see:** "Email/Password" in the list with the status **Enabled**.

## Step 3: Allow your website address

Firebase only accepts sign-ins from addresses you approve. This is called an **authorized domain**.

1. Still in **Authentication**, open the **Settings** tab, then **Authorized domains**.
2. Check that `babatundeawo.github.io` is in the list. If it is not, click **Add domain**, type `babatundeawo.github.io` and click **Add**.
3. If you use your own domain name (for example `register.myschool.org`), add that too.

**You should see:** your address in the list.

## Step 4: Create your login

There is no public sign-up. You create each teacher's account here.

1. In **Authentication**, open the **Users** tab.
2. Click **Add user**.
3. Type your email address and a strong password (at least 12 characters; a short sentence works well). Click **Add user**.
4. Find your new row in the list. Click the small **copy** icon next to the **User UID** (a long mix of letters and numbers). Paste it somewhere safe for a moment, such as a note on your phone. You need it in the next step.

**You should see:** your email in the Users list with a User UID.

To add another teacher later, repeat Steps 4 and 5 for them.

## Step 5: Put yourself on the staff list

The database only opens for people on this list.

1. In the left menu click **Build**, then **Firestore Database**, then open the **Data** tab.
2. Click **Start collection**.
3. For **Collection ID** type exactly: `staff` and click **Next**.
4. For **Document ID** paste the **User UID** you copied. Do not type it by hand.
5. For the first field, type `name` as the **Field**, leave **Type** as `string`, and type your name as the **Value**.
6. Click **Save**.

**You should see:** a `staff` collection next to your existing `students`, `attendance` and `holidays` collections, containing one document named after your UID.

## Step 6: Copy the project's settings

The website needs six identifying values for your project. They are **not passwords** (see the glossary).

1. Click the **gear icon** next to **Project Overview** (top left) and choose **Project settings**.
2. Stay on the **General** tab and scroll down to **Your apps**.
3. Click your web app (the one with the `</>` icon). If there is none, click **Add app**, choose the web icon `</>`, give it the nickname `attendance`, and click **Register app**.
4. Find the box called **SDK setup and configuration** and choose **Config**. You will see lines like `apiKey: "..."`, `authDomain: "..."`, and so on.

Keep this page open for the next step.

## Step 7: Add the settings to GitHub

GitHub keeps them as **secrets** (private settings the build can use but nobody can read back).

1. Go to your repository on GitHub: <https://github.com/babatundeawo/attendance>.
2. Click **Settings** (top bar), then **Secrets and variables** in the left menu, then **Actions**.
3. Click **New repository secret**. For each row in this table, type the **Name** exactly as shown, paste the value from Firebase **without the quote marks**, and click **Add secret**.

| Secret name | Copy the value of |
| --- | --- |
| `FIREBASE_API_KEY` | `apiKey` |
| `FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `FIREBASE_PROJECT_ID` | `projectId` |
| `FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `FIREBASE_APP_ID` | `appId` |

**You should see:** six secrets listed under **Repository secrets**. Their values are hidden; that is normal.

Now publish the website by following `DEPLOYMENT.md` (merge the pull request, then check the **Actions** tab for a green tick).

## Step 8: Publish the new database rules

Do this **after** the new site is live and you can see the sign-in page.

1. In the repository on GitHub, open the file `firestore.rules` and click the **copy** icon (top right of the file view).
2. Back in the Firebase Console go to **Build > Firestore Database**, open the **Rules** tab.
3. Select everything in the editor, delete it, and paste what you copied.
4. Click **Publish**.

**You should see:** a "Rules published" message and the new rules in the editor.

## How to test that login works

1. Open the site in a private/incognito browser window. **You should see** the Sign in page, not the register.
2. Sign in with the email and password from Step 4. **You should see** the register, with your students and a green "Synced" label at the top.
3. Click the round letter at the top right, then **Sign out**. **You should see** the Sign in page again.
4. Try a wrong password. **You should see** a message saying the email and password do not match.
5. Optional: create a second user in Step 4 but do **not** add them to the staff list. When they sign in **you should see** "Access not granted yet". This proves the staff list is working.

## Common errors and fixes

| What you see | What it means | Fix |
| --- | --- | --- |
| `auth/unauthorized-domain` or "This website address is not authorised" | Step 3 is missing your address | Add the domain in **Authentication > Settings > Authorized domains** |
| "The app's Firebase settings are not correct" / `invalid-api-key` | A secret was pasted wrongly | Re-add the secret (include no quote marks or spaces), then run the deployment again |
| "Setup isn't finished" page | The build had no secrets | Do Step 7, then **Actions > Deploy > Run workflow** |
| `permission-denied`, "Access not granted yet" | The account is not on the staff list, or the staff document ID is wrong | Redo Step 5 using the UID from **Authentication > Users** |
| "Email and password sign-in is not switched on" | Step 2 is missing | Enable **Email/Password** |
| "Too many attempts" | Several wrong passwords in a row | Wait a few minutes, or use **Forgot your password?** |
| Reset email does not arrive | It may be in spam | Check spam; make sure the email matches the one in the Users list |

Note: this register does not use pop-up sign-in or email verification, so you will not meet "popup blocked" or "user not verified" errors. Accounts you create yourself work immediately.

## Glossary

- **API key**: a label that tells Google which project the website belongs to. In Firebase web apps it is **public by design** and is not a password. The database rules are what protect your data.
- **Authorized domain**: a website address Firebase allows sign-ins from.
- **Security rules**: instructions saved in Firebase that decide who may read or change each piece of data. They are enforced by Google, not by the website.
- **Secret**: a setting stored privately in GitHub so it never appears in the code.
- **Custom claim**: a hidden label attached to an account (for example "admin"). This register does not need one; it uses the `staff` list instead because that can be edited without any programming.
- **UID**: the unique ID Firebase gives each account.

## What NOT to share or commit

- Never put your Firebase **service account key** (a `.json` file with `private_key` in it) anywhere in the repository or in chat.
- Never share teachers' passwords. Reset them from **Authentication > Users** instead.
- Never paste secrets into a file, an issue, or a pull request. Only use **Settings > Secrets and variables > Actions**.

## Recommended later: App Check

**Firebase App Check** helps stop other programs from pretending to be your website. It is optional and takes a few extra steps (in Firebase: **Build > App Check > Get started**, register the web app with reCAPTCHA, then switch on enforcement for Firestore once the site runs cleanly). Also keep an eye on **Usage** in the Firestore tab: if reads or writes suddenly spike, someone may be misusing the site.

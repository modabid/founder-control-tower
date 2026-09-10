# One-Time GitHub Setup

## Recommended

Create a **private** GitHub repository named:

`founder-control-tower`

Then from the downloaded/unzipped project folder:

```bash
git init
git add .
git commit -m "chore: establish Founder Control Tower GitHub baseline"
git branch -M main
git remote add origin https://github.com/<OWNER>/founder-control-tower.git
git push -u origin main
```

If using GitHub Desktop, choose **Add Existing Repository**, select this folder, then **Publish repository** as Private.

## Direct AI-to-GitHub Updates

For ChatGPT to push future changes directly, the active ChatGPT workspace needs an authenticated GitHub integration/connector (or an authenticated environment with GitHub CLI/token). This migration session did not have one available, so this baseline is prepared locally rather than falsely claiming it was pushed.

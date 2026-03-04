# Git Branching Guide

This guide will walk you through creating a new branch and working on a new feature.

---

## Step-by-Step: Creating a New Feature Branch

### 1. Ensure you are on the `main` branch

Before creating a new branch, make sure you have the latest code from `main`.

```bash
git checkout main
git pull origin main
```

### 2. Create and switch to your new branch

Use the following command to create a new branch and switch to it immediately.
The `-b` flag means: **"create this branch first, then switch to it."**

```bash
git checkout -b feature/client-improvements
```

> 💡 **Naming convention:** Use `feature/short-description` — all lowercase, hyphens instead of spaces.

### 3. Push the branch to GitHub (first time only)

On the **first push** of a new branch, you need to link it to GitHub using `--set-upstream`:

```bash
git push --set-upstream origin feature/client-improvements
```

> 💡 After this one-time setup, future pushes only need `git push` — no extra flags.

### 4. Verify your branch

Check that you are on the new branch and that it exists both locally and remotely:

```bash
git branch -a
```

You should see:

- `* feature/client-improvements` — the `*` means you are **currently on this branch**
- `remotes/origin/feature/client-improvements` — it exists on GitHub ✅

### 5. Develop your feature

Now you can safely make changes to your code. Your changes are **isolated** to this branch and will not affect `main`.

### 6. Save your progress (Stage and Commit)

Once you've made some changes, save them to your branch:

```bash
git add .
git commit -m "Describe what you changed"
```

### 7. Push your updates

After the first push, subsequent pushes are simple:

```bash
git push
```

---

## Essential Git Branch Commands

| Command | Description |
| :--- | :--- |
| `git branch` | List all local branches. (The current one is starred `*`). |
| `git branch -a` | List all local **and** remote branches. |
| `git checkout -b <name>` | Create a new branch and switch to it. |
| `git checkout <name>` | Switch to an existing branch. |
| `git push --set-upstream origin <name>` | Push a new branch to GitHub for the first time. |
| `git push` | Push updates to GitHub (after the first push). |
| `git pull` | Pull the latest changes from GitHub to your local branch. |
| `git status` | Check which branch you are on and see pending changes. |
| `git merge <name>` | Merge the specified branch into your current branch. |
| `git branch -d <name>` | Delete a local branch (use `-D` to force). |
| `git push origin --delete <name>` | Delete a branch from the remote server. |

---

---

## How to Rename a Branch

If you need to rename a branch (both locally and on GitHub):

```bash
# 1. Rename locally
git branch -m old-branch-name new-branch-name

# 2. Push the new name to GitHub and set tracking
git push origin -u new-branch-name

# 3. Delete the old name from GitHub
git push origin --delete old-branch-name
```

> ⚠️ **Note:** After pushing, anyone else who had the old branch checked out will need to update their remote tracking references.

---

## Real Example — `feature/client-localstorage` (04/03/2026)

This branch started life as `feature/client-improvements` and was renamed before any commits were added.

```bash
# Branch was originally created as feature/client-improvements
# No commits had been made yet, so a rename was safe

# 1. Rename locally
git branch -m feature/client-improvements feature/client-localstorage

# 2. Push new name and set upstream tracking
git push origin -u feature/client-localstorage
# → Branch published to GitHub and linked ✅

# 3. Remove the old name from GitHub
git push origin --delete feature/client-improvements
# → Old branch deleted from remote ✅

# 4. Develop feature, then commit and push
git add src/hooks/usePersistedState.ts src/components/BookingForm.tsx
git commit -m "feat: add localStorage pre-fill for returning clients"
git push
# → Changes pushed to feature/client-localstorage ✅
```

> 💡 See `docs/Client-Recognition.md` for full details on what was implemented in this branch.

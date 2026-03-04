# Git Branching Guide

This guide will walk you through creating a new branch and working on a new feature.

## Step-by-Step: Creating a New Feature Branch

### 1. Ensure you are on the `main` branch

Before creating a new branch, make sure you have the latest code from `main`.

```bash
git checkout main
git pull origin main
```

### 2. Create and switch to your new branch

Use the following command to create a new branch (e.g., `feature-ui-update`) and switch to it immediately:

```bash
git checkout -b feature-ui-update
```

### 3. Develop your feature

Now you can safely make changes to your code. Your changes will be isolated to this branch.

### 4. Save your progress (Stage and Commit)

Once you've made some changes, save them to your branch:

```bash
git add .
git commit -m "Add new feature UI components"
```

### 5. Push your branch to the cloud

To back up your branch and make it visible on GitHub:

```bash
git push -u origin feature-ui-update
```

---

## Essential Git Branch Commands

| Command | Description |
| :--- | :--- |
| `git branch` | List all local branches. (The current one is starred). |
| `git branch -a` | List all local and remote branches. |
| `git checkout -b <name>` | Create a new branch and switch to it. |
| `git checkout <name>` | Switch to an existing branch. |
| `git merge <name>` | Merge the specified branch into your current branch. |
| `git branch -d <name>` | Delete a local branch (use `-D` to force). |
| `git push origin --delete <name>` | Delete a branch from the remote server. |
| `git status` | Check which branch you are on and see pending changes. |

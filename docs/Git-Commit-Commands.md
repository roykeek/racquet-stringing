# Git Workflow: Commit and Sync Changes

To commit and sync your changes, you can type the following commands into your terminal one by one:

### 1. Stage Changes

Stage all your changes to prepare them for a commit:

```
git add .
```

### 2. Commit Changes

Commit the changes with a descriptive message. Replace the text inside the quotes with a summary of what you actually changed:

```
git commit -m "enter your commit message here"
```

### 3. Push Changes

Push the changes to your **remote** repository to sync them:

```
git push
```

---

### Alternative: One-Line Sync

Since you prefer combining these commands using `;`, you can run the entire sequence at once on a single line:

```
git add . ; git commit -m "enter your commit message here" ; git push
```

# Git Workflow: FIRST Commit and Sync after Branch created

If this is the first time you are committing and pushing from a newly created local branch, the sequence is almost identical,
but you need to tell Git to create the corresponding branch on the remote repository (the "upstream" branch) during your push.

Here is the step-by-step sequence to type in your terminal:

### 1. Stage Changes

Stage all your changes to prepare them for a commit:

```
git add .
```

### 2. Commit Changes

Commit the changes with a descriptive message. Replace the text inside the quotes with a summary of what you actually changed:

```
git commit -m "enter your commit message here"
```

### 3. Push and set the upstream branch: (Replace <branch-name> with the actual name of your branch)

```
git push -u origin <branch-name>
```

(The -u stands for --set-upstream. You only need to add this flag the very first time you push a new branch.
For all future pushes on this branch, you can just type git push like normal!)

**Running it all at once:** Keeping your preference in mind, if you want to run these together using ; on a single line, you would type:

```
git add . ; git commit -m "enter your commit message here" ; git push -u origin <branch-name>
```

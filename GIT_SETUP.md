# Git Setup & SSH Authentication Documentation

## Overview
This document details the steps taken to clone the `99-names` repository, set up SSH deploy key authentication, and successfully push changes to GitHub from a MacOS machine.

---

## Environment
- **OS:** macOS
- **Shell:** zsh
- **Machine:** MacBook (local)
- **GitHub Repo:** https://github.com/mohammedashfaqhussain510/99-names

---

## Step 1: Clone the Repository

The repository was cloned to the Desktop using:

```bash
git clone https://github.com/mohammedashfaqhussain510/99-names.git ~/Desktop/99-names
```

This created a local copy of the repository at:
```
/Users/mohammedashfaqhussain/Desktop/99-names
```

---

## Step 2: Configure HTTPS Credential Helper

We initially attempted HTTPS-based authentication using the macOS Keychain credential helper:

```bash
git -C ~/Desktop/99-names config credential.helper osxkeychain
```

### Problem Encountered
When pushing, Git used previously saved credentials for a **different GitHub account** (`mdashfaqhussain`), which resulted in a `403 Permission Denied` error:

```
remote: Permission to mohammedashfaqhussain510/99-names.git denied to mdashfaqhussain.
fatal: unable to access '...': The requested URL returned error: 403
```

### Decision
Switched to **SSH authentication using a Deploy Key** for a more reliable and secure setup.

---

## Step 3: Generate SSH Deploy Key

A new SSH key pair was generated specifically for this repository:

```bash
ssh-keygen -t ed25519 -C "deploy-key-99-names" -f ~/.ssh/99-names_deploy_key -N ""
```

This created two files:

| File | Description |
|------|-------------|
| `~/.ssh/99-names_deploy_key` | Private key — stays on this machine, never shared |
| `~/.ssh/99-names_deploy_key.pub` | Public key — added to GitHub |

The public key value:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIK/pB6cQbrIp5N2FwphoTufzztqe1Dc0Li4MQsUKWcD5 deploy-key-99-names
```

---

## Step 4: Add Deploy Key to GitHub

1. Navigated to: **GitHub repo → Settings → Deploy keys → Add deploy key**
2. **Title:** `99-names deploy key`
3. **Key:** Pasted the public key from above
4. **Checked "Allow write access"** to enable pushing
5. Clicked **"Add key"**

> Deploy keys grant SSH access to a **single repository only**, making them more secure than personal access tokens for repo-specific use.

---

## Step 5: Configure SSH to Use the Deploy Key

Added an entry to `~/.ssh/config` to map a custom SSH host alias to the deploy key:

```
Host github-99-names
  HostName github.com
  User git
  IdentityFile ~/.ssh/99-names_deploy_key
```

This tells SSH: *"When connecting to `github-99-names`, use the deploy key."*

---

## Step 6: Update Git Remote URL to Use SSH

Changed the repository's remote URL from HTTPS to SSH:

```bash
git -C ~/Desktop/99-names remote set-url origin git@github-99-names:mohammedashfaqhussain510/99-names.git
```

Verify with:
```bash
git -C ~/Desktop/99-names remote -v
```

---

## Step 7: Push Changes

Tested the SSH connection and pushed successfully:

```bash
ssh -o StrictHostKeyChecking=no -T git@github-99-names
# Output: Hi mohammedashfaqhussain510/99-names! You've successfully authenticated...

git -C ~/Desktop/99-names push
# Output: main -> main ✓
```

---

## How to Push in the Future

From this Mac, simply run from inside the repo:

```bash
git add .
git commit -m "Your commit message"
git push
```

No passwords or tokens needed — SSH handles authentication automatically.

---

## Scope & Limitations

| | This Setup |
|---|---|
| Works on this Mac | ✅ Yes |
| Works in any terminal/IDE on this Mac | ✅ Yes (Warp, VS Code, iTerm, etc.) |
| Works on a different machine | ❌ No (private key is machine-specific) |
| Works for other repositories | ❌ No (deploy key is repo-specific) |

### To push from another machine
- **Option A (Recommended):** Set up a personal SSH key and add it to **GitHub → Settings → SSH and GPG keys**. This works for all your repos.
- **Option B:** Copy `~/.ssh/99-names_deploy_key` to the other machine and repeat Steps 5–6.

---

## File Locations Summary

| File | Purpose |
|------|---------|
| `~/.ssh/99-names_deploy_key` | SSH private key |
| `~/.ssh/99-names_deploy_key.pub` | SSH public key (added to GitHub) |
| `~/.ssh/config` | SSH config with host alias |
| `~/Desktop/99-names/` | Local repository |

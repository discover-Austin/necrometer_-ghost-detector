Plan to permanently remove keystore from Git history

This document outlines a safe plan to expunge the committed keystore from the repository history.

Important: Rewriting history is destructive and requires force-pushing. All collaborators must coordinate.

Steps (high-level):

1. Create a backup branch/tag:
   - git branch backup-before-bfg
   - git push origin backup-before-bfg

2. Use BFG or git filter-repo locally to remove the keystore file path:
   - Recommended (BFG):
     - java -jar bfg.jar --delete-files my-release-key.jks
     - git reflog expire --expire=now --all && git gc --prune=now --aggressive
   - Or (git filter-repo):
     - git filter-repo --path android/android/keystore/my-release-key.jks --invert-paths

3. Force-push rewritten branches to the remote (example):
   - git push --force origin release/ar-polish

4. Inform collaborators:
   - They must fetch and reset their local branches:
     - git fetch origin
     - git switch release/ar-polish
     - git reset --hard origin/release/ar-polish

5. Rotate any keys/credentials that may have been exposed.

I can perform this rewrite for you after you confirm and coordinate with collaborators. I will create the backup branch first and then run the rewrite.

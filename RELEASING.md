Release process

1. Prepare secrets in GitHub repository settings (Settings → Secrets & variables → Actions):
   - RELEASE_KEYSTORE_BASE64: base64-encoded bytes of your keystore (my-release-key.jks)
   - RELEASE_KEYSTORE_PASSWORD
   - RELEASE_KEY_ALIAS
   - RELEASE_KEY_PASSWORD
   - GOOGLE_PLAY_SERVICE_ACCOUNT_JSON (optional): JSON contents of a Play Console service account key

2. Tag a release:
   - git tag v1.0.0
   - git push origin v1.0.0

3. The workflow `.github/workflows/android-release-sign.yml` will:
   - Build the web app
   - Decode the keystore and set signing environment variables
   - Build a signed AAB
   - Upload the AAB as a workflow artifact
   - If `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` is provided, upload the AAB to Google Play (internal track by default)
   - Otherwise, it will create a GitHub Release and attach the AAB as an asset

4. Verify the uploaded artifact and proceed with Play Console distribution if required.

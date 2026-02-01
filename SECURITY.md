# Security Policy

This policy applies to the Necrometer - Ghost Detector web app, mobile builds, and the optional backend in the `server/` directory.

## Supported Versions

Security fixes are provided for the latest release on the default branch. If you are not on the latest version, please update first.

## Reporting a Vulnerability

Please report security issues privately by using GitHub Security Advisories:

1. Go to the repository on GitHub.
2. Click **Security** → **Advisories** → **Report a vulnerability**.
3. Include steps to reproduce, impact, and any proof-of-concept details.

If you cannot use GitHub Security Advisories, open a private support request with details in the issue title: “Security Report (Confidential)”.

## Response Expectations

- Initial response within **72 hours**.
- Status update within **7 days**.
- Coordinated disclosure once a fix is available.

## Scope

In scope:
- Web app (Angular client and PWA assets)
- Mobile builds (Capacitor Android/iOS)
- Optional backend proxy in `server/`
- Data storage and export/import features
- Integrations that run inside this repository

Out of scope:
- Issues in third-party services (e.g., Google Gemini API)
- Device OS vulnerabilities or manufacturer firmware issues
- Social engineering or physical attacks

## Security Considerations

- **API keys**: The app may store Gemini API keys in local storage. Treat these keys as secrets and rotate them if exposure is suspected.
- **Permissions**: The app requests camera, microphone, and location permissions. Report any unexpected data access or transmission.
- **Data exports**: Ensure exported JSON/CSV files are stored securely if they contain sensitive information.

## Safe Harbor

We support good-faith security research. Please avoid privacy violations, denial of service, or destructive testing. We will not pursue legal action for research conducted under this policy.

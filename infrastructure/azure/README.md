# Azure AD Configuration (Planix)

Planix uses Azure AD only for **authentication** (SSO for internal CHR users).
There is no Azure-hosted infrastructure — hosting is Coolify on CHR hardware.

## App registrations required

Two registrations in the CHR Azure AD tenant:

1. **Planix Web (SPA)** — public client, MSAL.js
   - Redirect URI (SPA): `https://planix.chrsolutions.com/login`
   - Exposes a scope to call the API (e.g. `access_as_user`)
   - Provides `VITE_AZURE_AD_CLIENT_ID` and `VITE_AZURE_AD_TENANT_ID`

2. **Planix API** — protected resource
   - Application ID URI: `api://planix` (→ `AZURE_AD_API_AUDIENCE`)
   - The web app is granted delegated permission to this scope
   - Provides `AZURE_AD_CLIENT_ID` and `AZURE_AD_TENANT_ID` for token validation

## Token validation (already implemented)

`packages/api/src/services/auth.service.ts` validates incoming Azure AD access
tokens against the tenant JWKS
(`https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys`), checking
issuer (`.../v2.0`) and audience (`AZURE_AD_API_AUDIENCE`).

## Firewall

Outbound HTTPS must be permitted from the data center to:
- `login.microsoftonline.com:443`
- `graph.microsoft.com:443` (Teams integration, later phase)
- `api.anthropic.com:443` (AI Insights)

> **Action for Trent:** confirm these three egress rules with the CHR
> infrastructure team before Phase 0 deployment testing.

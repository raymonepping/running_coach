# Vault

Vault is used for machine identity and secret storage.

## Local Bootstrap

The compose stack starts Vault in dev mode, then runs:

```bash
infra/vault/bootstrap.sh
```

The script:

- enables AppRole auth
- enables KV v2 at `secret/`
- enables transit
- creates backend and agent policies
- creates the `running-coach` transit key
- writes Couchbase credentials to `secret/running-coach/backend`
- creates backend and agent AppRole roles

## Backend Identity

The backend logs in with:

- `VAULT_BACKEND_ROLE_ID`
- `VAULT_BACKEND_SECRET_ID`

It then reads Couchbase credentials from:

```text
secret/data/running-coach/backend
```

## Production Guidance

Do not use Vault dev mode in production. Use real Vault storage, rotate AppRole secret IDs, narrow policies further by deployment environment, and keep transit decrypt access limited to services that truly need it.

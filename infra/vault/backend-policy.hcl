path "secret/data/running-coach/backend" {
  capabilities = ["read"]
}

path "transit/encrypt/running-coach" {
  capabilities = ["update"]
}

path "transit/decrypt/running-coach" {
  capabilities = ["update"]
}

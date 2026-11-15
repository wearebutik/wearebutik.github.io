# La zona wearebutik.com su Cloudflare, per la parte che riguarda il sito
# (ADR-0002, #infrastructure). .github/workflows/infra.yml lancia `tofu plan`
# su ogni PR che tocca questa cartella e `tofu apply` all'unione su main. Lo
# stato, cifrato, sta nel branch `stato-infra`.
#
# Qui c'è solo ciò che il sito usa: i record della radice, di www e dei
# sottodomini dei social, i redirect della zona e le impostazioni HTTPS.
# Restano fuori, e OpenTofu non li tocca perché non li dichiara:
# - la posta (MX) e le verifiche (TXT, il CNAME di verifica di Squarespace);
# - i record AAAA 100:: di beta, preview e form, che crea wrangler con i
#   domini personalizzati dei Worker (apps/web/wrangler*.jsonc,
#   apps/functions/wrangler.jsonc); allo stesso modo `wearebutik.com` → butik.

terraform {
  required_version = "~> 1.13"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.28"
    }
  }
}

# Il token arriva nella variabile d'ambiente CLOUDFLARE_API_TOKEN (secret
# TOFU_CLOUDFLARE_API_TOKEN): Account API token dell'account Butik, solo zona
# wearebutik.com, con DNS Write, Zone Read, Zone Settings Write, Dynamic URL
# Redirects Write (1Password, vault butik, «Cloudflare – token env0
# wearebutik.com»).
#
# In locale, lo stesso flusso: lo stato da `git show origin/stato-infra:
# cloudflare.tfstate`, la cifratura in TF_ENCRYPTION come nel workflow, con
# la passphrase di 1Password («OpenTofu – passphrase stato infra/cloudflare»).
provider "cloudflare" {}

locals {
  # L'ID della zona wearebutik.com: non è un segreto.
  zone_id = "f00a0cf63c298c9d1c32e73149349a67"
}

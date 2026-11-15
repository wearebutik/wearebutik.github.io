# I record del sito. Oggi la radice e www puntano a Squarespace; il passaggio
# al sito nuovo (#96) li toglie da qui, e `wearebutik.com` lo prende il
# Worker. Per tornare indietro basta ripristinare questo file.

locals {
  # IP di Squarespace → ID del record su Cloudflare (per l'import).
  squarespace_a = {
    "198.185.159.144" = "a737c53140b551787567b131ecf9420d"
    "198.185.159.145" = "c048748fe09a1819498b2638afa265d3"
    "198.49.23.144"   = "fce4eecfe616ad48ab06bf6965709608"
    "198.49.23.145"   = "a6ce0919346d9e665b4a3f71ec5e91cd"
  }
}

resource "cloudflare_dns_record" "radice_squarespace" {
  for_each = local.squarespace_a

  zone_id = local.zone_id
  name    = "wearebutik.com"
  type    = "A"
  content = each.key
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "www" {
  zone_id = local.zone_id
  name    = "www.wearebutik.com"
  type    = "CNAME"
  content = "ext-sq.squarespace.com"
  ttl     = 1
  proxied = false
}

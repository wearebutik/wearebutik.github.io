# Verifiche di proprietà del dominio da parte di servizi esterni.
#
# Il TXT google-site-verification=h2dR… già presente nella zona resta fuori:
# appartiene a un altro account Google (o a Google Workspace) e non lo
# gestiamo da qui.

# Search Console, proprietà dominio wearebutik.com verificata dall'account
# Google di Gabriele (#100). Se si toglie, la proprietà resta ma perde la
# verifica di questo account.
resource "cloudflare_dns_record" "search_console" {
  zone_id = local.zone_id
  name    = "wearebutik.com"
  type    = "TXT"
  content = "\"google-site-verification=Agf3UnDVQ9XN8jHMSo69hkicT7wqEnGdk-sTAns_yog\""
  ttl     = 1
}

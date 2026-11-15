# I record del sito. La radice `wearebutik.com` non sta qui: è il dominio
# personalizzato del Worker `butik`, e il suo record lo crea wrangler
# (apps/web/wrangler.jsonc, deploy.yml).
#
# Fino al passaggio (#96) radice e www puntavano a Squarespace, con i record A
# 198.185.159.144, 198.185.159.145, 198.49.23.144, 198.49.23.145 e il CNAME
# www → ext-sq.squarespace.com: per tornare indietro si ripristinano da git.

# www risponde solo con un 301 verso la radice (redirect.tf): il record serve
# ad avere il proxy di Cloudflare, dove scatta il redirect (#136).
resource "cloudflare_dns_record" "www" {
  zone_id = local.zone_id
  name    = "www.wearebutik.com"
  type    = "CNAME"
  content = "wearebutik.com"
  ttl     = 1
  proxied = true
}

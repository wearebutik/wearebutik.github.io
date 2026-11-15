# I sottodomini dei social (instagram.wearebutik.com e gli altri): un 302
# verso il profilo. Il record A punta a 192.0.2.1, un indirizzo che non
# esiste (RFC 5737): serve solo ad avere il proxy di Cloudflare, dove scatta
# il redirect.

locals {
  social = {
    instagram = { record_id = "012cc7c8ca52e251c8240f024c14781a", url = "https://www.instagram.com/wearebutik/", nome = "Instagram" }
    facebook  = { record_id = "ecac50a863817f0027692e550a38ef70", url = "https://www.facebook.com/wearebutikcom/", nome = "Facebook" }
    linkedin  = { record_id = "dbc21176277bc36f9976f3f0c01f0e12", url = "https://www.linkedin.com/company/butik-s-r-l", nome = "LinkedIn" }
    youtube   = { record_id = "cb3ed7fad617f2ac12632bbbe967d9cd", url = "https://www.youtube.com/channel/UCn0tOGnc1FWyDa1qbOX_nHQ", nome = "YouTube" }
    spotify   = { record_id = "3d12660f8d2c84d1e3e57c3358a9d72f", url = "https://open.spotify.com/user/4ncb22q3pfbs8xlzuwuiwqbyq", nome = "Spotify" }
  }

  # L'ordine delle regole nel ruleset (redirect.tf).
  ordine_social = ["instagram", "facebook", "linkedin", "youtube", "spotify"]
}

resource "cloudflare_dns_record" "social" {
  for_each = local.social

  zone_id = local.zone_id
  name    = "${each.key}.wearebutik.com"
  type    = "A"
  content = "192.0.2.1"
  ttl     = 1
  proxied = true
}

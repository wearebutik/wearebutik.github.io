# Impostazioni HTTPS e di ottimizzazione della zona (#135, #137).

# Full (strict): Cloudflare verifica il certificato dell'origine. I Worker
# hanno un certificato valido; con Squarespace serviva `full`.
resource "cloudflare_zone_setting" "ssl" {
  zone_id    = local.zone_id
  setting_id = "ssl"
  value      = "strict"
}

# http:// → https:// con un 301 su tutta la zona. HSTS arriva dopo qualche
# settimana senza problemi (#135).
resource "cloudflare_zone_setting" "always_use_https" {
  zone_id    = local.zone_id
  setting_id = "always_use_https"
  value      = "on"
}

# Rocket Loader riscrive gli script della pagina: spento, il sito gestisce da
# sé il caricamento (consenso, view transitions).
resource "cloudflare_zone_setting" "rocket_loader" {
  zone_id    = local.zone_id
  setting_id = "rocket_loader"
  value      = "off"
}

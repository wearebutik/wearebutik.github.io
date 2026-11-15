# Impostazioni HTTPS e di ottimizzazione della zona (#135, #137).

resource "cloudflare_zone_setting" "ssl" {
  zone_id    = local.zone_id
  setting_id = "ssl"
  value      = "full"
}

resource "cloudflare_zone_setting" "always_use_https" {
  zone_id    = local.zone_id
  setting_id = "always_use_https"
  value      = "off"
}

# Rocket Loader riscrive gli script della pagina: spento, il sito gestisce da
# sé il caricamento (consenso, view transitions).
resource "cloudflare_zone_setting" "rocket_loader" {
  zone_id    = local.zone_id
  setting_id = "rocket_loader"
  value      = "off"
}

# Impostazioni HTTPS e di ottimizzazione della zona (#135, #137).

# Full (strict): Cloudflare verifica il certificato dell'origine. I Worker
# hanno un certificato valido; con Squarespace serviva `full`.
resource "cloudflare_zone_setting" "ssl" {
  zone_id    = local.zone_id
  setting_id = "ssl"
  value      = "strict"
}

# http:// → https:// con un 301 su tutta la zona.
resource "cloudflare_zone_setting" "always_use_https" {
  zone_id    = local.zone_id
  setting_id = "always_use_https"
  value      = "on"
}

# HSTS (#135): per un mese dall'ultima visita il browser apre wearebutik.com e
# i suoi sottodomini solo in HTTPS, senza passare dal 301 qui sopra. Un mese,
# non di più: il sito è a basso rischio e uno sbaglio (certificato rotto,
# sottodominio solo HTTP) pesa al massimo per un mese su chi l'ha visitato.
# Ogni sottodominio nuovo deve avere HTTPS da subito. Niente preload: uscire
# dalle liste dei browser richiede mesi. `nosniff` resta spento perché
# X-Content-Type-Options lo manda già il sito (apps/web/public/_headers).
resource "cloudflare_zone_setting" "security_header" {
  zone_id    = local.zone_id
  setting_id = "security_header"
  value = {
    strict_transport_security = {
      enabled            = true
      max_age            = 2592000
      include_subdomains = true
      preload            = false
      nosniff            = false
    }
  }
}

# Rocket Loader riscrive gli script della pagina: spento, il sito gestisce da
# sé il caricamento (consenso, view transitions).
resource "cloudflare_zone_setting" "rocket_loader" {
  zone_id    = local.zone_id
  setting_id = "rocket_loader"
  value      = "off"
}

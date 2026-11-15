# I redirect della zona (Single Redirects, fase http_request_dynamic_redirect).
# La fase ha un solo ruleset: tutte le sue regole stanno qui, e una regola
# aggiunta dalla dashboard sparisce al prossimo apply. Le regole valgono per
# host diversi, quindi l'ordine non cambia il risultato.

locals {
  # Host canonico senza www (#136): stesso percorso e stessa query string,
  # un solo salto anche da http://www.
  regola_www = {
    description = "www.wearebutik.com verso wearebutik.com"
    expression  = "(http.host eq \"www.wearebutik.com\")"
    action      = "redirect"
    enabled     = true
    action_parameters = {
      from_value = {
        status_code           = 301
        preserve_query_string = true
        target_url = {
          expression = "concat(\"https://wearebutik.com\", http.request.uri.path)"
        }
      }
    }
  }

  regole_social = [
    for s in local.ordine_social : {
      description = "${s}.wearebutik.com verso ${local.social[s].nome}"
      expression  = "(http.request.full_uri wildcard r\"http*://${s}.wearebutik.com/*\")"
      action      = "redirect"
      enabled     = true
      action_parameters = {
        from_value = {
          status_code           = 302
          preserve_query_string = false
          target_url = {
            expression = "wildcard_replace(http.request.full_uri, r\"http*://${s}.wearebutik.com/*\", r\"${local.social[s].url}\")"
          }
        }
      }
    }
  ]
}

resource "cloudflare_ruleset" "redirect" {
  zone_id = local.zone_id
  name    = "default"
  kind    = "zone"
  phase   = "http_request_dynamic_redirect"

  rules = concat(local.regole_social, [local.regola_www])
}

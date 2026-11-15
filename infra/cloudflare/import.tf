# Presa in carico di ciò che esiste già nella zona: il primo apply importa
# queste risorse nello stato senza cambiarle. Dopo quell'apply questo file
# non serve più e si può togliere.

import {
  for_each = local.squarespace_a
  to       = cloudflare_dns_record.radice_squarespace[each.key]
  id       = "${local.zone_id}/${each.value}"
}

import {
  to = cloudflare_dns_record.www
  id = "${local.zone_id}/2e789be7456cfb4cd0f8c0c58e04ae98"
}

import {
  for_each = local.social
  to       = cloudflare_dns_record.social[each.key]
  id       = "${local.zone_id}/${each.value.record_id}"
}

import {
  to = cloudflare_ruleset.redirect
  id = "zones/${local.zone_id}/71eb075edcb544d3b8be0c77e28fa3d5"
}

import {
  to = cloudflare_zone_setting.ssl
  id = "${local.zone_id}/ssl"
}

import {
  to = cloudflare_zone_setting.always_use_https
  id = "${local.zone_id}/always_use_https"
}

import {
  to = cloudflare_zone_setting.rocket_loader
  id = "${local.zone_id}/rocket_loader"
}

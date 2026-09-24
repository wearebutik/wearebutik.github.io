import { progetto } from './progetto';
import { servizio } from './servizio';
import { imageBlock, imageSide, imageCarousel, figura } from './blocchi';
import { sezioniServizio } from './sezioniServizio';
import { testoFormattato, link } from './testo';
import { pagineTypes, testoLegale } from './pagine';

export const schemaTypes = [
  progetto,
  servizio,
  figura,
  imageBlock,
  imageSide,
  imageCarousel,
  ...sezioniServizio,
  testoFormattato,
  testoLegale,
  link,
  ...pagineTypes,
];

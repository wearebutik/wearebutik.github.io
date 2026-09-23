import { progetto } from './progetto';
import { servizio } from './servizio';
import { imageBlock, imageSide, imageCarousel, figura } from './blocchi';
import { sezioniServizio } from './sezioniServizio';
import { testoFormattato, link } from './testo';

export const schemaTypes = [
  progetto,
  servizio,
  figura,
  imageBlock,
  imageSide,
  imageCarousel,
  ...sezioniServizio,
  testoFormattato,
  link,
];

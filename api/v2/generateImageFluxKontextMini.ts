import { TASK_TYPES } from '../_constants.js';
import {
  authMiddleware,
  bindParamsMiddleware,
} from '../_utils/middlewares/index.js';
import { translateMiddleware } from '../_utils/middlewares/translate.js';
import { tryGenerateHandler } from '../_utils/middlewares/tryGenerate.js';
import withHandler from '../_utils/withHandler.js';
import { generateHandler } from './generateImageFluxKontext.js';
import { IMAGE_FLUX_KONTEXT_MINI } from '../tools/_zaps.js';

export const POST = withHandler(
  generateHandler('Flux Mini', IMAGE_FLUX_KONTEXT_MINI),
  [
    authMiddleware,
    bindParamsMiddleware,
    translateMiddleware,
    tryGenerateHandler(TASK_TYPES.IMAGE),
  ],
);

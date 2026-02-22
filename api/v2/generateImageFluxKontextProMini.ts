import { IMAGE_FLUX_KONTEXT_PRO_MINI } from '../tools/_zaps.js';
import { TASK_TYPES } from '../_constants.js';
import { authMiddleware } from '../_utils/middlewares/auth.js';
import withHandler from '../_utils/withHandler.js';
import { bindParamsMiddleware } from '../_utils/middlewares/index.js';
import { translateMiddleware } from '../_utils/middlewares/translate.js';
import { tryGenerateHandler } from '../_utils/middlewares/tryGenerate.js';
import { generateHandler } from './generateImageFluxKontextPro.js';

export const POST = withHandler(
  generateHandler('Flux Mini', IMAGE_FLUX_KONTEXT_PRO_MINI),
  [
    authMiddleware,
    bindParamsMiddleware,
    translateMiddleware,
    tryGenerateHandler(TASK_TYPES.IMAGE),
  ],
);

import { generateHandler } from './generateImageArtPro.js';
import withHandler from '../_utils/withHandler.js';
import { authMiddleware } from '../_utils/middlewares/auth.js';
import { bindParamsMiddleware } from '../_utils/middlewares/index.js';
import { translateMiddleware } from '../_utils/middlewares/translate.js';
import { replaceCharacterPromptsMiddleware } from '../_utils/middlewares/replaceCharacterPrompts.js';
import { tryGenerateHandler } from '../_utils/middlewares/tryGenerate.js';
import { TASK_TYPES } from '../_constants.js';
import { generatePromptMiddleware } from '../_utils/middlewares/improvePrompt.js';

export const POST = withHandler(generateHandler('Art Unlimited'), [
  authMiddleware,
  bindParamsMiddleware,
  replaceCharacterPromptsMiddleware,
  translateMiddleware,
  generatePromptMiddleware('Art Unlimited'),
  tryGenerateHandler(TASK_TYPES.IMAGE),
]);

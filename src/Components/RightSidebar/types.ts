import { SingleCharacter as OriginalSingleCharacter } from './CharactersSelector';

export type GenerationModel =
  | 'Auto Model'
  | 'Animagine'
  | 'Illustrious'
  | 'Flux'
  | 'Gemini'
  | 'Gemini Pro'
  | 'GPT'
  | 'Noobai'
  | 'Neta'
  | 'Art Pro'
  | 'Art Unlimited'
  | 'Seedream 4.5'
  | 'Seedream 4'
  | 'Seedream Edit'
  | 'KusaXL'
  | 'FluxContext';

export interface LabelData {
  category: string;
  key?: string;
  labels: Array<
    | string
    | { label: string; value: string; image?: string; kusaSpecial?: boolean }
  >;
  isKusa?: boolean;
}

export type SingleCharacter = OriginalSingleCharacter;

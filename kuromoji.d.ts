declare module "kuromoji" {
  export type KuromojiToken = {
    surface_form: string;
    reading?: string;
    word_type?: string;
    pos?: string;
  };

  export type KuromojiTokenizer = {
    tokenize(text: string): KuromojiToken[];
  };

  export function builder(options: {
    dicPath: string;
  }): {
    build(
      callback: (error: Error | null, tokenizer: KuromojiTokenizer) => void,
    ): void;
  };
}

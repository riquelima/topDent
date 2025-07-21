/// <reference types="react" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'dotlottie-wc': React.HTMLAttributes<HTMLElement> & {
        src: string;
        speed?: string;
        autoplay?: boolean;
        loop?: boolean;
      };
    }
  }
}

export {};
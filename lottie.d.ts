/// <reference types="react" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'dotlottie-wc': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src: string;
        speed?: string;
        autoPlay?: boolean;
        loop?: boolean;
      }, HTMLElement>;
    }
  }
}

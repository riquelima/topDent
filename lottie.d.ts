// This file provides TypeScript definitions for the <dotlottie-wc> custom element.
// This is a global declaration file that extends the JSX namespace for TypeScript.
import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'dotlottie-wc': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src: string;
        speed?: string;
        autoPlay?: boolean;
        loop?: boolean;
      };
    }
  }
}

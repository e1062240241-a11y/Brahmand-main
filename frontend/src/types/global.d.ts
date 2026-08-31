export {};

declare module 'react-native' {
  namespace StyleSheet {
    export const absoluteFillObject: {
      position: 'absolute';
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
    };
  }
}

declare module 'expo-contacts' {
  export interface Contact {
    [key: string]: any;
  }
}

declare global {
  var global: typeof globalThis;
}

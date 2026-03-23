declare module 'uuid' {
  export const v4: () => string;
  export const v1: () => string;
  export const v3: (name: string | number[], namespace: string | number[]) => string;
  export const v5: (name: string | number[], namespace: string | number[]) => string;
  export const validate: (uuid: string) => boolean;
  export const version: (uuid: string) => number;
}
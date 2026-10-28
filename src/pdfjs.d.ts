declare module "pdfjs-dist" {
  export const version: string;
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };
  export function getDocument(src: any): {
    promise: Promise<any>;
  };
}

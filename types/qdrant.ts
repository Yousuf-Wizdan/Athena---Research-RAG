export interface QdrantPayload {
  text: string;
  source: string;
  title?: string;
  [key: string]: any;
}

export interface QdrantDocument {
  id: string | number;
  score?: number;
  payload: QdrantPayload;
}

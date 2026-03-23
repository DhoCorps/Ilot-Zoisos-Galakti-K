// packages/core/src/types/status.types.ts
import { IBaseNode } from './common.types';

export interface IStatus extends IBaseNode {
  uid: string;
  intitule: string;     
  color: string;        
  icon?: string;        
  order: number;        
  isFinal: boolean;     
}
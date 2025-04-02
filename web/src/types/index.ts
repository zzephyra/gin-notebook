import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};


export interface IconType {
  fill?: string, 
  filled?: boolean, 
  size?: number, 
  height?: number, 
  width?: number, 
  [key: string]: any
} 
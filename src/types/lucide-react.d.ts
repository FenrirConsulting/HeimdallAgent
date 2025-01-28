// src/types/lucide-react.d.ts
declare module 'lucide-react' {
    import { FC, SVGProps } from 'react';

    export interface IconProps extends SVGProps<SVGSVGElement> {
        size?: string | number;
        color?: string;
        strokeWidth?: string | number;
    }

    export type Icon = FC<IconProps>;

    export const Send: Icon;
    export const MessageSquarePlus: Icon;
    export const Loader: Icon;
    // Add other icons as needed
}
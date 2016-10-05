import { NgGridItem } from 'angular2-grid';

export interface NeonGridItem extends NgGridItem {
    id?: string;
    type?: string;
    bindings?: any;
    title?: string;
    description?: string;
}

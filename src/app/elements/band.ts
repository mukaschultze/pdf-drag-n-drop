export interface Band {
    key: string;
    elements: Element[];
}

export interface Element {
    key: string;
}

export interface LeafElement extends Element {
}

export interface InternalElement extends Element {
    elements: Element[];
}

export interface Resource {
}

export interface RootPDF extends InternalElement {
    key: "root";
}

export interface Content extends InternalElement {
    key: "content";
}

export interface Image extends LeafElement {
    key: "image";
    prop?: string;
    url?: string;
}

export interface StaticText extends LeafElement {
    key: "text-static";
    text: string;
}

export interface DynamicText extends LeafElement {
    key: "text-dynamic";
    prop: string;
}

export interface Foreach extends InternalElement {
    key: "foreach";
    let: string;
    of: string;
}

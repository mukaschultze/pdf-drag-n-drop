import { Injectable } from "@angular/core";
import { Content, TDocumentDefinitions } from "pdfmake/build/pdfmake";
import { from, Observable, of, throwError } from "rxjs";
import { flatMap, map } from "rxjs/operators";
import * as elements from "../elements/band";
import { mergeToArray } from "../util";
import { ImageCacheService } from "./image-cache.service";

const mappingFunctions: { [key: string]: (item: elements.Element, payload: ReportPayload, context: MapperContext) => Observable<Content | Content[]> } = {
};

function Mapper(key?: string) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        key = key || propertyKey;

        if (mappingFunctions[key]) {
            console.warn(`Duplicated mapper '${key}'`);
        }

        mappingFunctions[key] = target[propertyKey];
    };
}

type ReportPayload = any;
interface MapperContext { parent: elements.Element; pdf: elements.Element; }

@Injectable({ providedIn: "root" })
export class ReportsService {

    constructor(
        private imageCache: ImageCacheService,
    ) { }

    public generateReport(template: elements.RootPDF, payload: ReportPayload): Observable<TDocumentDefinitions> {
        return this.buildElement(template, payload, { parent: template, pdf: template }) as Observable<TDocumentDefinitions>;
    }

    private buildElement(item: elements.Element, payload: ReportPayload, context: MapperContext): Observable<Content | Content[]> {
        const mapper = mappingFunctions[`${item.key}`];

        if (!mapper) {
            return throwError(new Error(`No mapper found for key '${item.key}'`));
        }

        return mapper.call(this, item, payload, context);
    }

    private buildElements(items: elements.Element[], payload: ReportPayload, context: MapperContext): Observable<Content[]> {

        if (!Array.isArray(items)) {
            return throwError(new Error("'items' is not an array"));
        }

        return from(items).pipe(
            mergeToArray((item) => this.buildElement(item, payload, context).pipe(
                flatMap((i) => Array.isArray(i) ? i : [i]),
            )),
        );
    }

    private getPayloadProperty(prop: string, payload: ReportPayload, defaultValue?: any) {
        if (!payload) {
            return defaultValue;
        }

        const tokens = prop.split(".");
        return tokens.reduce((obj, key) => obj && obj[key], payload) || defaultValue;
    }

    @Mapper("root")
    private rootPdf(item: elements.RootPDF, payload: ReportPayload, context: MapperContext): Observable<TDocumentDefinitions> {
        return this.buildElements(item.elements, payload, { ...context, parent: item }).pipe(
            map((children) => children.reduce((acc, val) => ({ ...acc, ...val }), {}) as TDocumentDefinitions),
        );
    }

    @Mapper("content")
    private content(item: elements.Content, payload: ReportPayload, context: MapperContext): Observable<TDocumentDefinitions> {
        return this.buildElements(item.elements, payload, { ...context, parent: item }).pipe(
            map((children) => ({ content: children } as TDocumentDefinitions)),
        );
    }

    @Mapper("header")
    private header(item: elements.InternalElement, payload: ReportPayload, context: MapperContext): Observable<Content> {
        return this.buildElements(item.elements, payload, { ...context, parent: item }).pipe(
            map((children) => ({ header: children })),
        );
    }

    @Mapper("footer")
    private footer(item: elements.InternalElement, payload: ReportPayload, context: MapperContext): Observable<Content> {
        return this.buildElements(item.elements, payload, { ...context, parent: item }).pipe(
            map((children) => ({ footer: children })),
        );
    }

    @Mapper("foreach")
    private foreach(item: elements.Foreach, payload: ReportPayload, context: MapperContext): Observable<Content[]> {

        const { let: _let, of, elements } = item;
        const arr = this.getPayloadProperty(of, payload, [undefined]);

        if (!Array.isArray(arr)) {
            return throwError(new Error(`Property '${of}' in foreach is not an array`));
        }

        const cloneElement = (value, index) => this.buildElements(elements, payload && { ...payload, [_let]: value, index }, { ...context, parent: item });

        return from(arr).pipe(
            mergeToArray((val, idx) => cloneElement(val, idx)),
            map((a) => a.flatMap((b) => b)),
        );
    }

    @Mapper("text-dynamic")
    private textDynanic(item: elements.DynamicText, payload: ReportPayload, { parent, pdf }: MapperContext): Observable<Content> {
        return of({ text: `${this.getPayloadProperty(`${item.prop}`, payload, item.prop)}` });
    }

    @Mapper("text-static")
    private textStatic(item: elements.StaticText, payload: ReportPayload, { parent, pdf }: MapperContext): Observable<Content> {
        return of({ text: `${item.text}` });
    }

    @Mapper("columns")
    private columns(item: elements.InternalElement, payload: ReportPayload, context: MapperContext): Observable<Content> {
        return this.buildElements(item.elements, payload, { ...context, parent: item }).pipe(
            map((children) => ({ columns: children })),
        );
    }

    @Mapper("stack")
    private stack(item: elements.InternalElement, payload: ReportPayload, context: MapperContext): Observable<Content> {
        return this.buildElements(item.elements, payload, { ...context, parent: item }).pipe(
            map((children) => ({ stack: children })),
        );
    }

    @Mapper("image")
    private image(item: elements.Image, payload: ReportPayload, { parent, pdf }: MapperContext): Observable<Content> {

        if (!item.url && !item.prop) {
            return throwError(new Error("Image has no URL, prop, or resource"));
        }

        if (item.prop) {
            item.url = this.getPayloadProperty(item.prop, payload, this.imageCache.placeholderImage);
        }

        return this.imageCache.addImageToVFS(item.url).pipe(
            map((image) => ({ image })),
        );
    }

    @Mapper("meta")
    private meta(item: elements.DocumentMetadata, payload: ReportPayload, { parent, pdf }: MapperContext): Observable<Content> {

        if (!item.prop) {
            console.warn("'meta' key has no 'prop' value, it will be ignored");
            return of(undefined);
        }

        const propValue = this.getPayloadProperty(item.prop, payload, {});

        return of({ info: propValue });
    }

}

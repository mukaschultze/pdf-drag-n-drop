import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import * as elements from "../elements/band";

@Injectable({ providedIn: "root" })
export class PdfGeneratorService {

    private _currentPdf = new BehaviorSubject<elements.Element>(undefined);

    public get currentPdf(): Observable<elements.Element> {
        return this._currentPdf.asObservable();
    }

    public setCurrentPdf(pdf: elements.Element) {
        this._currentPdf.next(pdf);
    }

    public addChildNode(parent: elements.Element, child: elements.Element) {
        // parent.children.push(child);
        this._currentPdf.next({ ...this._currentPdf.value as any });
    }

}

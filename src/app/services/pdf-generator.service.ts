import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { DocDefinition } from "../elements/doc-definition";
import { PdfElement } from "../elements/pdf-element";

@Injectable({ providedIn: "root" })
export class PdfGeneratorService {

  private _currentPdf = new BehaviorSubject<DocDefinition>(undefined);

  public get currentPdf(): Observable<DocDefinition> {
    return this._currentPdf.asObservable();
  }

  public setCurrentPdf(pdf: DocDefinition) {
    this._currentPdf.next(pdf);
  }

  public addChildNode(parent: PdfElement, child: PdfElement) {
    // parent.children.push(child);
    this._currentPdf.next({ ...this._currentPdf.value as any });
  }

}

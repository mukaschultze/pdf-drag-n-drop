import { map } from "rxjs/operators";
import { PdfContent } from "./content";
import { PdfElement } from "./pdf-element";

export class DocDefinition extends PdfElement {

    public key = () => "root";

    public label = () => "PDF";

    public allowedChildElements() {
        return [
            PdfContent,
        ];
    }

    public build() {
        return this.getBuildedChildren().pipe(
            map((children) => children.reduce((acc, val) => ({
                ...acc,
                ...val,
            }), {})),
        );
    }

}

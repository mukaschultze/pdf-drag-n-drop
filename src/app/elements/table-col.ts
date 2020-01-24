import { PdfImage } from "./image";
import { PdfList } from "./list";
import { PdfElement } from "./pdf-element";
import { PdfText } from "./text";

export class PdfTableColumn extends PdfElement {

    public key = () => "table-col";

    public label = () => `Coluna`;

    public allowedChildElements() {
        return [
            PdfText,
            PdfList,
            PdfImage,
        ];
    }

    public build() {
        return this.getBuildedChildren();
    }

}

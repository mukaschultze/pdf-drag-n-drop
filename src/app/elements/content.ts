import { map } from "rxjs/operators";
import { PdfColumns } from "./columns";
import { PdfImage } from "./image";
import { PdfList } from "./list";
import { PdfElement } from "./pdf-element";
import { PdfText } from "./text";

export class PdfContent extends PdfElement {

    public key = () => "content";

    public label = () => "Conteúdo";

    public allowedChildElements() {
        return [
            PdfText,
            PdfImage,
            PdfList,
            PdfColumns,
        ];
    }

    public build() {
        return this.getBuildedChildren().pipe(
            map((content) => ({ content })),
        );
    }

}

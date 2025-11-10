import { RouteType } from "./route";

export const COMPONENT_TAG_NAME = 'route-dialog';
export class RouteDialogElement extends RouteType(HTMLDialogElement)
{

}
if(customElements.get(COMPONENT_TAG_NAME) == null)
{
    customElements.define(COMPONENT_TAG_NAME, RouteDialogElement, { extends: 'dialog' });
}
import { RouteType } from "./route";

export const COMPONENT_TAG_NAME = 'route-page';
export class RoutePageElement extends RouteType()
{

}
if(customElements.get(COMPONENT_TAG_NAME) == null)
{
    customElements.define(COMPONENT_TAG_NAME, RoutePageElement);
}
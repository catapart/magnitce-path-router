
/**
 * @param elementType Either `HTMLAnchorElement` or `HTMLButtonElement`, depending
 * on the type of element the extension class is subclassing from.
 * @description
 * A class definition wrapped in a function so that
 * multiple element types can extend this object.  
 * Links must extend an `HTMLAnchorElement`, while
 * Buttons msut extend an `HTMLButtonElement` element.
 * @returns A class that defines a Link for routing.
 */
export const Link = (elementType: (typeof HTMLAnchorElement)|(typeof HTMLButtonElement)) =>
{
    return class extends elementType
    {

    }
}
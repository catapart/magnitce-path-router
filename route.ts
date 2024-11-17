import { ROUTEPROPERTY_DATA_ATTRIBUTE_KEYWORD } from "./path-router";
import { RouteDialogElement } from "./route-dialog.route";
import { RoutePageElement } from "./route-page.route";

export enum PathRouteEvent
{
    BeforeOpen = "beforeopen",
    AfterOpen = "afteropen",
    BeforeClose = "beforeclose",
    AfterClose = "afterclose",
    Refresh = 'refresh',
}

export type RouteProperties = { [key: string]: string };

/**
 * @param elementType The type of `HTMLElement` that will act as the base type for this Route.
 * @description
 * A class definition wrapped in a function so that
 * multiple element types can extend this object.  
 * Pages can extend any `HTMLElement`, but Dialogs 
 * *must* extend an `HTMLDialogElement`.
 * @returns A class that defines a Route.
 */
export const RouteType = (elementType: typeof HTMLElement = HTMLElement) =>
{
    return class extends elementType
    {
        static value = "Hello"

        async enter(path: string)
        {
            this.#enter(path);
        }
        async #enter(path: string)
        {
            this.dispatchEvent(new CustomEvent(PathRouteEvent.BeforeOpen, { detail: { path, properties: this.getProperties() }}));
            // await Promise.allSettled(this.blockingBeforeOpen.map(value => value()));

            this.dataset.entering = '';
    
            await Promise.allSettled(this.getAnimations({ subtree: true }).map((animation) => animation.finished));
    
            delete this.dataset.entering;
            this.#open();
    
            this.dispatchEvent(new Event(PathRouteEvent.AfterOpen));
            // await Promise.allSettled(this.blockingAfterOpen.map(value => value()));
        }
        async #open()
        {
            this.toggleAttribute('open', true);
            this.setAttribute('aria-current', "page");
        }

        async exit()
        {

        }
        async #exit()
        {
            
        }
        async #close()
        {
            this.toggleAttribute('open', false);
            this.removeAttribute('aria-current');
        }

        getProperties()
        {
            const dataValues = Object.entries(this.dataset);

            const properties = dataValues.reduce((result, item) =>
            {
                const dataItemName = item[0];
                if(!dataItemName.startsWith(ROUTEPROPERTY_DATA_ATTRIBUTE_KEYWORD)) { return result; }

                const key = dataItemName[ROUTEPROPERTY_DATA_ATTRIBUTE_KEYWORD.length].toLowerCase() // lowercase first letter of property name
                + dataItemName.substring(ROUTEPROPERTY_DATA_ATTRIBUTE_KEYWORD.length + 1); // remove keyword and first letter of property name
                const value = item[1];

                result[key] = value;
                return result;
            }, {} as { [key: string]: string|undefined|null });

            return properties;
        }
    }
}

export type Route = RoutePageElement|RouteDialogElement;
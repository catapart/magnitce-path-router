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
        currentProcess: Promise<void> = Promise.resolve();
        canBeOpened: () => Promise<boolean> = async () => true;
        canBeClosed: () => Promise<boolean> = async () => true;

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

        async enter(path: string)
        {
            const canNavigate = await this.canBeOpened();
            if(!canNavigate) { console.info("Navigation blocked by validity check."); return false; }

            this.currentProcess = this.#enter(path);

            await this.currentProcess;
            this.currentProcess = Promise.resolve();
            return true;
        }
        async #enter(path: string)
        {
            this.dispatchEvent(new CustomEvent(PathRouteEvent.BeforeOpen, { detail: { path, properties: this.getProperties() }}));
            await Promise.allSettled(this.#blockingBeforeOpen.map(value => value()));

            this.dataset.entering = '';
    
            await Promise.allSettled(this.getAnimations({ subtree: true }).map((animation) => animation.finished));
    
            delete this.dataset.entering;
            this.#open();
    
            this.dispatchEvent(new Event(PathRouteEvent.AfterOpen));
            await Promise.allSettled(this.#blockingAfterOpen.map(value => value()));
        }
        async #open()
        {
            this.toggleAttribute('open', true);
            this.setAttribute('aria-current', "page");
        }

        async exit()
        {
            const canNavigate = await this.canBeClosed();
            if(canNavigate == false) 
            { 
                console.info("Navigation blocked by validity check."); 
                return false; 
            }

            this.currentProcess = this.#exit();

            await this.currentProcess;
            this.currentProcess = Promise.resolve();
            return true;
        }
        async #exit()
        {
            this.dispatchEvent(new Event(PathRouteEvent.BeforeClose));
            await Promise.allSettled(this.#blockingBeforeClose.map(value => value()));

            this.dataset.exiting = '';
            this.removeAttribute('open');
    
            await Promise.all(this.getAnimations({ subtree: true }).map((animation) => animation.finished));

            this.#close();
            delete this.dataset.exiting;

            this.dispatchEvent(new Event(PathRouteEvent.AfterClose));
            await Promise.allSettled(this.#blockingAfterClose.map(value => value()));
        }
        #close()
        {
            this.toggleAttribute('open', false);
            this.removeAttribute('aria-current');
        }
        
        #blockingBeforeOpen: (() => void|Promise<void>)[] = [];
        #blockingAfterOpen: (() => void|Promise<void>)[] = [];
        #blockingBeforeClose: (() => void|Promise<void>)[] = [];
        #blockingAfterClose: (() => void|Promise<void>)[] = [];
        applyEventListener<K extends (keyof HTMLElementEventMap|'beforeopen'|'afteropen'|'beforeclose'|'afterclose')>(type: K, listener: (this: HTMLElement, ev: Event|CustomEvent) => void|Promise<void>, options?: boolean | AddEventListenerOptions | undefined)
        {
            const isOpen = this.getAttribute('open') != null;
            this.addEventListener(type, listener, options);
            if((type == PathRouteEvent.BeforeOpen.toString() 
            || type == PathRouteEvent.AfterOpen.toString())
            && isOpen == true)
            {
                this.dispatchEvent(new Event(type));
            }
            else if(type == PathRouteEvent.BeforeClose.toString()
            || type == PathRouteEvent.AfterClose.toString()
            && isOpen == false)
            {
                this.dispatchEvent(new Event(type));
            }
        }
        addBlockingEventListener(eventName: PathRouteEvent, handler: () => void|Promise<void>)
        {
            switch(eventName)
            {
            case PathRouteEvent.BeforeOpen: this.#blockingBeforeOpen.push(handler); break;
            case PathRouteEvent.AfterOpen: this.#blockingAfterOpen.push(handler); break;
            case PathRouteEvent.BeforeClose: this.#blockingBeforeClose.push(handler); break;
            case PathRouteEvent.AfterClose: this.#blockingAfterClose.push(handler); break;
            }
        }
        applyBlockingEventListener(eventName: PathRouteEvent, handler: () => void|Promise<void>)
        {
            const isOpen = this.getAttribute('open') != null;
            this.addBlockingEventListener(eventName, handler);
            if((eventName == PathRouteEvent.BeforeOpen.toString() 
            || eventName == PathRouteEvent.AfterOpen.toString())
            && isOpen == true)
            {
                this.dispatchEvent(new Event(eventName));
            }
            else if(eventName == PathRouteEvent.BeforeClose.toString()
            || eventName == PathRouteEvent.AfterClose.toString()
            && isOpen == false)
            {
                this.dispatchEvent(new Event(eventName));
            }
        }
    }
}

export type Route = RoutePageElement|RouteDialogElement;
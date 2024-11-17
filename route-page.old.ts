import { PathRouterElement, COMPONENT_TAG_NAME as ROUTER_TAG_NAME } from "./path-router";

export enum PathRouteEvent
{
    BeforeOpen = "beforeopen",
    AfterOpen = "afteropen",
    BeforeClose = "beforeclose",
    AfterClose = "afterclose",
    Refresh = 'refresh',
}

export type RouteProperties = { [key: string]: string };


export const COMPONENT_TAG_NAME = 'route-page';
export class RoutePageElement extends HTMLElement
{
    get router(): PathRouterElement | null
    {
        return this.closest(ROUTER_TAG_NAME);
    }

    private blockingBeforeOpen: (() => void|Promise<void>)[] = [];
    private blockingAfterOpen: (() => void|Promise<void>)[] = [];
    private blockingBeforeClose: (() => void|Promise<void>)[] = [];
    private blockingAfterClose: (() => void|Promise<void>)[] = [];

    currentProcess: Promise<void>;
    canBeOpened: () => Promise<boolean>;
    canBeClosed: () => Promise<boolean>;
    subrouting: boolean = true;

    currentProperties: RouteProperties|undefined;

    constructor()
    {
        super();
        
        this.currentProcess = Promise.resolve();
        this.canBeOpened = async () => true;
        this.canBeClosed = async () => true;
        
    }

    async open(path: string): Promise<boolean>
    {
        const canNavigate = await this.canBeOpened();
        if(!canNavigate) { console.info("Navigation blocked by validity check."); return false; }
        
        this.currentProcess = this.#open(path);
        await this.currentProcess;
        this.currentProcess = Promise.resolve();
        return true;
    }
    async #open(path: string)
    {
        this.currentProperties = this.getProperties(path);
        this.dispatchEvent(new CustomEvent(PathRouteEvent.BeforeOpen, { detail: { path, properties: this.currentProperties }}));
        await Promise.allSettled(this.blockingBeforeOpen.map(value => value()));

        this.dataset.entering = '';
  
        await Promise.allSettled(this.getAnimations({ subtree: true }).map((animation) => animation.finished));
  
  
        delete this.dataset.entering;
        this.toggleAttribute('open', true);
        this.setAttribute('aria-current', "page");
  
        this.dispatchEvent(new Event(PathRouteEvent.AfterOpen));
        await Promise.allSettled(this.blockingAfterOpen.map(value => value()));
    }
    async close(): Promise<boolean>
    {
        const canNavigate = await this.canBeClosed();
        if(canNavigate == false) 
        { 
            console.info("Navigation blocked by validity check."); 
            return false; 
        }

        this.currentProcess = this.#close();
        await this.currentProcess;
        this.currentProcess = Promise.resolve();
        return true;
    }
    async #close()
    {
        this.dispatchEvent(new Event(PathRouteEvent.BeforeClose));
        await Promise.allSettled(this.blockingBeforeClose.map(value => value()));

        this.dataset.exiting = '';
        this.removeAttribute('open');
  
        await Promise.all(this.getAnimations({ subtree: true }).map((animation) => animation.finished));
  
        delete this.dataset.exiting;
        this.removeAttribute('aria-current');
        this.currentProperties = undefined;

        this.dispatchEvent(new Event(PathRouteEvent.AfterClose));
        await Promise.allSettled(this.blockingAfterClose.map(value => value()));
    }
    
    getProperties(targetPath?: string|null): RouteProperties
    {
        const properties: RouteProperties = { };
        
        // const ancestorRoutePaths = this.#getAncestorRoutePaths();

        // // capture any fulfilled route properties
        // for(let i = 0; i < ancestorRoutePaths.length; i++)
        // {
        //     let nextPath = ancestorRoutePaths[i + 1];
        //     if(nextPath == null) { break; }
            
        //     const currentPath = (ancestorRoutePaths[i].startsWith('/')) ? ancestorRoutePaths[i].substring(1) : ancestorRoutePaths[i];
        //     const currentPathArray = currentPath.split('/');
        //     nextPath = (nextPath.startsWith('/')) ? nextPath.substring(1) : nextPath;
        //     const nextPathArray = nextPath.split('/');
        //     if(currentPathArray[currentPathArray.length - 1].indexOf(':') != -1)
        //     {
        //         properties[currentPathArray[currentPathArray.length - 1].substring(1)] = nextPathArray[0];
        //     }
        // }

        if(targetPath == null)
        {
            const parentRouter = this.closest('path-router');
            if(parentRouter == null) { return properties; }
            targetPath = parentRouter.getAttribute('path');
        }
        if(targetPath == null) { return properties; }
        properties.targetPath = targetPath;

        const path = (targetPath.startsWith('/')) ? targetPath.substring(1) : targetPath;
        const pathArray = path.split('/');
        
        const routePathAttribute = this.getAttribute('path') ?? "";
        const routePath = (routePathAttribute.startsWith('/')) ? routePathAttribute.substring(1) : routePathAttribute;
        const routeArray = routePath!.split('/');

        let subroute = targetPath;
        // first element is always empty string
        for(let i = 0; i < routeArray.length; i++)
        {
            const slug = routeArray[i];
            if(slug.startsWith(':'))
            {
                let propertyName = slug.substring(1);
                if(propertyName.endsWith('?'))
                {
                    propertyName = propertyName.substring(0, propertyName.length-1);
                }
                properties[propertyName] = (i < pathArray.length) ? pathArray[i] : "";
                subroute = subroute.substring(subroute.indexOf(properties[propertyName]));
                
                // if the route has a variable, and this is in a
                // parent route element, values are substituted
                // if they have an exact name match.
                // const parentRoute = this.parentElement?.closest('route-page,[is="route-dialog"]');
                // if(parentRoute != null)
                // {
                //     const parentProperties = (parentRoute as RoutePageElement).getProperties();
                //     if(parentProperties[propertyName] != null)
                //     {
                //         properties[propertyName] = parentProperties[propertyName];
                //     }
                // }
            }
            else
            {
                subroute = subroute.substring(slug.length);
            }
        }

        properties.subroute = subroute;

        return properties;
    }

    #getAncestorRoutePaths()
    {
        let parentRoute = this.parentElement?.closest('route-page,[is="route-dialog"]');
        const pathArray: string[] = [this.getAttribute('path') ?? ""];
        while(parentRoute != null)
        {
            pathArray.push(parentRoute.getAttribute('path') ?? "");
            parentRoute = parentRoute.parentElement?.closest('route-page,[is="route-dialog"]');
        }
        return pathArray.toReversed();
    }

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
        case PathRouteEvent.BeforeOpen: this.blockingBeforeOpen.push(handler); break;
        case PathRouteEvent.AfterOpen: this.blockingAfterOpen.push(handler); break;
        case PathRouteEvent.BeforeClose: this.blockingBeforeClose.push(handler); break;
        case PathRouteEvent.AfterClose: this.blockingAfterClose.push(handler); break;
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
if(customElements.get(COMPONENT_TAG_NAME) == null)
{
    customElements.define(COMPONENT_TAG_NAME, RoutePageElement);
}
import { PathRouterComponent, COMPONENT_TAG_NAME as ROUTER_TAG_NAME } from "./path-router";

export enum PathRouteEvent
{
    BeforeOpen = "beforeopen",
    AfterOpen = "afteropen",
    BeforeClose = "beforeclose",
    AfterClose = "afterclose"
}

export type RouteProperties = { [key: string]: string };


export const COMPONENT_TAG_NAME = 'path-route';
export class PathRouteComponent extends HTMLElement
{
    get router(): PathRouterComponent | null
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
        this.dataset.entering = '';

        const properties = this.getProperties(path);
  
        this.dispatchEvent(new CustomEvent(PathRouteEvent.BeforeOpen, { detail: { path, properties }}));
        await Promise.allSettled(this.blockingBeforeOpen.map(value => value()));

        const allowSubroute = (this.getAttribute('subrouting') ?? this.closest('path-router[subrouting]')?.getAttribute('subrouting')) != "false";
        console.log(allowSubroute, properties);
        if(allowSubroute == true)
        {
            const subrouter = this.querySelector<PathRouterComponent>(':scope > path-router');
            console.log(subrouter);
            if(subrouter != null)
            {
                const subroute = this.extractSubroute(path);
                await subrouter.navigate(subroute);
                console.log(subroute);
            }
        }
  
  
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
        this.removeAttribute('open');
        this.dataset.exiting = '';
  
        this.dispatchEvent(new Event(PathRouteEvent.BeforeClose));
        await Promise.allSettled(this.blockingBeforeClose.map(value => value()));
  
  
        await Promise.all(this.getAnimations({ subtree: true }).map((animation) => animation.finished));
  
        delete this.dataset.exiting;
        this.removeAttribute('aria-current');
  
        this.dispatchEvent(new Event(PathRouteEvent.AfterClose));
        await Promise.allSettled(this.blockingAfterClose.map(value => value()));
    }

    
    getProperties(targetPath: string): RouteProperties
    {
        const routePathAttribute = this.getAttribute('path') ?? "";
        const routePath = (routePathAttribute.startsWith('/')) ? routePathAttribute.substring(1) : routePathAttribute;
        const routeArray = routePath!.split('/');
        const path = (targetPath.startsWith('/')) ? targetPath.substring(1) : targetPath;
        const pathArray = path.split('/');
        
        const properties: RouteProperties = {};

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
            }
        }

        return properties;
    }
    extractSubroute(targetPath: string)
    {
        const routePathAttribute = this.getAttribute('path') ?? "";
        const routePath = (routePathAttribute.startsWith('/')) ? routePathAttribute.substring(1) : routePathAttribute;
        const routeArray = routePath!.split('/');
        const path = (targetPath.startsWith('/')) ? targetPath.substring(1) : targetPath;
        const pathArray = path.split('/');

        const lastNonParameterIndex = routeArray.findLastIndex(item => !item.startsWith(':')) + 1;
        console.log(lastNonParameterIndex);

        const subPathArray = pathArray.slice(lastNonParameterIndex);
        return subPathArray.join('/');
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
    customElements.define(COMPONENT_TAG_NAME, PathRouteComponent);
}
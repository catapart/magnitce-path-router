import './route-page';
import './route-dialog';

import { RouteDialogElement, COMPONENT_TAG_NAME as ROUTEDIALOG_TAG_NAME } from "./route-dialog";
import { RoutePageElement, COMPONENT_TAG_NAME as ROUTE_TAG_NAME, RouteProperties, PathRouteEvent } from "./route-page";

export { RoutePageElement, RouteDialogElement }

export enum PathRouterEvent
{
    /** Fires when a route is opened or closed.  */
    Change = 'change',
    /** Fires when the router's `path` attribute is updated. */
    PathChange = 'pathchange',
}

export type PathRouterAttributes =
{
    /** The target path for the router to route to. */
    path?: string;
}


const COMPONENT_STYLESHEET = new CSSStyleSheet();
COMPONENT_STYLESHEET.replaceSync(`
/* 
   Animations will not be awaitable in code if they have a display of none.
   Instead, the routes are stacked in a grid.
 */
path-router
{ 
    display: var(--router-display, grid);
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
}
route-page:not([open],[data-entering],[data-exiting]) path-router { display: none; /* browser bug when rendering visibility? */ }
route-page
{
    display: var(--route-display, block);
    visibility: hidden;
    grid-row: 1;
    grid-column: 1;
}
/* 
   Visibility is visible during the entering and exiting phases
   to allow for animations to be awaited.
 */
route-page[open]
,route-page[data-entering]
,route-page[data-exiting]
{
    visibility: visible;
}
[is="route-link"]
,[is="route-button"]
{
    user-select: none;
}`);

export const COMPONENT_TAG_NAME = 'path-router';
export class PathRouterElement extends HTMLElement
{
    get routes()
    {
        return Array.from(this.querySelectorAll(`:scope > ${ROUTE_TAG_NAME}`) as NodeListOf<RoutePageElement>, (route: RoutePageElement) => route) as RoutePageElement[];
    }
    get routeDialogs()
    {
        return Array.from(this.querySelectorAll(`:scope > [is="${ROUTEDIALOG_TAG_NAME}"]`) as NodeListOf<RouteDialogElement>, (routeDialog: RouteDialogElement) => routeDialog) as RouteDialogElement[];
    }

    /** The `<page-route>` element currently being navigated to. */
    targetPageRoute: RoutePageElement|undefined;
    /** The `<page-route>` element that the router currently has open. */
    currentPageRoute: RoutePageElement|undefined;
    /** The `route-dialog` element currently being navigated to. */
    targetDialogRoute: RouteDialogElement|undefined;
    /** The `route-dialog` element that the router currently has open. */
    currentDialogRoute: RouteDialogElement|undefined;

    /** The route that will be selected if no other routes match the current path. */
    defaultRoute: RoutePageElement|undefined;

    /** The path which controls the router's navigation. */
    get path(): string|null  { return this.getAttribute("path"); }
    set path(value: string)  { this.setAttribute("path", value); }

    isInitialized: boolean = false;
    #initializationPromise: Promise<void>;
    #toUpdate: {newValue: string, oldValue: string}[] = [];

    #routeMap_pathToPage: Map<string, RoutePageElement|RouteDialogElement> = new Map();
    #routeMap_pathToDialog: Map<string, RouteDialogElement|RoutePageElement> = new Map();
    #routeMap_pathToPageOrDialog: Map<string, RoutePageElement|RouteDialogElement> = new Map();

    // exposed for route-page and route-dialog elements, not the api;
    resolveNavigation?: () => void;

    constructor()
    {
        super();
        this.#initializationPromise = this.#init();
        this.#dispatchInitialNavigation();
    }
    async #init()
    {
        return new Promise<void>(resolve =>
        {
            document.addEventListener('DOMContentLoaded', async () =>
            {
                for(let i = 0; i < this.routes.length; i++)
                {
                    const route = this.routes[i];

                    if(this.defaultRoute == null) { this.defaultRoute = route; }
                    // const path = route.getAttribute('path');
                    const isDefault = route.hasAttribute('default');
                    if(isDefault == true)
                    {
                        this.defaultRoute = route;
                    }
                }

                const dialogs = [...this.querySelectorAll('dialog')] as HTMLDialogElement[];
                for(let i = 0; i < dialogs.length; i++)
                {
                    dialogs[i].addEventListener('close', async (_event: Event) =>
                    {
                        const isClosing = dialogs[i].getAttribute('data-exiting') != null;
                        if(!isClosing)
                        {
                            const pathAttribute = this.getAttribute('path') ?? '/';
                            const path = pathAttribute.split('#')[0];
                            await this.navigate(path);
                        }
                        dialogs[i].removeAttribute('data-exiting');
                    })
                }

                

                this.#routeMap_pathToPage = new Map(this.routes
                .map(element => [element.getAttribute('path') ?? "", element] as [string, RoutePageElement|RouteDialogElement]));
                
                this.#routeMap_pathToDialog = new Map(this.routeDialogs
                .map(element => [element.getAttribute('path') ?? "", element] as [string, RouteDialogElement|RoutePageElement]));
                
                this.#routeMap_pathToPageOrDialog = new Map([...this.#routeMap_pathToPage, ...this.#routeMap_pathToDialog]);

                this.isInitialized = true;

                resolve();
            });
        });
    }
    async #dispatchInitialNavigation()
    {
        await this.#initializationPromise;
        if(!this.hasAttribute('manual'))
        {
            for(let i = 0; i < this.#toUpdate.length; i++)
            {
                await this.#update(this.#toUpdate[i].newValue, this.#toUpdate[i].oldValue);
            }
        }
    }

    // navigation

    /**
     * Navigate to a route path.
     * @param path route path
     */
    async navigate(path: string)
    {
        return new Promise<void>((resolve) =>
        {
            this.resolveNavigation = resolve;
            this.setAttribute('path', path);
        });
    }

    async #update(path: string, previousPath: string)
    {
        await this.#initializationPromise;

        const [ page, hash ] = this.destructurePath(path);
        const [ currentPage, currentHash ]= this.destructurePath(previousPath);
        
        let openedPage = false;
        let openedDialog = false;

        // if we're only navigating the dialog route, we don't need to indicate that the empty
        // route used for the page is a direction to set the route to the default.
        // otherwise, if the pages don't match, it's a page change.
        const pageHasChanged = (hash != "" && page == "") ? false : currentPage != page;
        const hashHasChanged = hash != currentHash;
        const currentlyOpen = this.querySelector('[open]');
        if(pageHasChanged == false && hashHasChanged == false && currentlyOpen != null)
        {
            if(this.resolveNavigation != null)
            { 
                this.resolveNavigation();
                this.resolveNavigation = undefined;
            }
            currentlyOpen.dispatchEvent(new CustomEvent(PathRouteEvent.Refresh, { detail: { path }, bubbles: true, cancelable: true }));
            return [ openedPage, openedDialog ];
        }
        
        // await any currently running processes
        await this.#awaitAllRouteProcesses();

        // find routes by path
        const [ pageRoute, dialogRoute ] = this.#getRouteElements(path);
        let openPagePromise;

        if(pageHasChanged == true || this.querySelector('[open]') == null)
        {
            // close the route that is currently open
            const closed = await this.#closeCurrentRoutePage();
            if(closed == false) 
            {
                // if closing the current route failed, router
                // assumes the implementer prevented navigation.
                console.warn('Navigation was prevented.');
                console.info(`Requested path: ${path}`);
                
                if(this.resolveNavigation != null)
                { 
                    this.resolveNavigation();
                    this.resolveNavigation = undefined;
                }

                return false; 
            }

            openPagePromise = this.#openRoutePage(pageRoute, page);
        }


        if(pageHasChanged || currentHash != hash)
        {
            // close the dialog route that is currently open, if any
            const closed = await this.#closeCurrentRouteDialog();
            // if closing the current route failed, router
            // assumes the implementer prevented navigation.
            if(closed != false) 
            {
                this.targetDialogRoute = dialogRoute;
                openedDialog = await this.#openRouteDialog(dialogRoute, hash);
            }
        }

        await openPagePromise; // deferred awaiting because the dialog does not need to await the page opening/transitions

        this.targetPageRoute = undefined;
        this.targetDialogRoute = undefined;
        if(this.resolveNavigation != null)
        { 
            this.resolveNavigation();
            this.resolveNavigation = undefined;
        }

        this.dispatchEvent(new CustomEvent(PathRouterEvent.PathChange, { detail: { path }, bubbles: true, cancelable: true }));
        
        return [ openedPage, openedDialog ];
    }
    async #awaitAllRouteProcesses()
    {
        return Promise.allSettled(this.routes.map((route) =>
        {
            return route.currentProcess;
        }));
    }
    #getRouteElements(path: string)
    {
        let [ pagePath, dialogPath ] = this.destructurePath(path);
        const pagePathArray = this.#getFormattedPathArray(pagePath);

        let foundPage: RoutePageElement|undefined = this.#getRouteElement<RoutePageElement>(pagePathArray, this.#routeMap_pathToPage);

        let foundDialog: RouteDialogElement|undefined = undefined;
        if(dialogPath != "")
        {
            const dialogPathArray = this.#getFormattedPathArray(dialogPath);
            foundDialog = this.#getRouteElement<RouteDialogElement>(dialogPathArray, this.#routeMap_pathToDialog);
        }

        return [ foundPage, foundDialog ] as [RoutePageElement, RouteDialogElement];
    }
    #getFormattedPathArray(path: string)
    {
        path = this.trimCharacter(path, '/');
        return path.split('/');
    }
    #getRouteElement<T extends RoutePageElement|RouteDialogElement>(pagePathArray: string[], routeMap: Map<string, RoutePageElement|RouteDialogElement>)
    {
        let foundRoute: RoutePageElement|RouteDialogElement|undefined = undefined;

        for(let [routePath, element] of routeMap)
        {
            routePath = this.trimCharacter(routePath, "/");
            const routeArray = routePath.split('/');
            
            let { match: routeMatchesPath, resolved } = this.#pathArraySelectsRouteArray(pagePathArray, routeArray);
            if(resolved == false) { continue; }

            // if there are any more slugs in the route that were not
            // requested by the path, they must all be parameters
            for(let i = pagePathArray.length; i < routeArray.length; i++)
            {
                const slug = routeArray[i];
                if(slug.startsWith(':') == false)
                {
                    routeMatchesPath = false;
                    break;
                }
            }

            if(routeMatchesPath == true)
            {
                foundRoute = element;
            }            
        }
        return foundRoute as T;
    }
    /**
     * Compares an array representing the requested path to an array representing a route
     * and returns whether or not the provided path would match the provided route.
     * @param pathArray an `array` representing the requested path.
     * @param routeArray an `array` representing a route
     * @returns `match` is set to `true` if the provided path matches the provided route, otherwise `false`.  
     * `resolved` is set to true if the function was not exited early. Used to determine whether a parent loop should continue.
     * @description the `pathArray` and `routeArray` parameters are created by trimming 
     * the first and last slashes from a path, and then splitting on the slash character.
     */
    #pathArraySelectsRouteArray(pathArray: string[], routeArray: string[])
    {
        let routeMatchesPath = false;
        let lastRouteSlugWasParameter = false;
        for(let i = 0; i < pathArray.length; i++)
        {
            const slug = routeArray[i];
            if(slug == null)
            {
                if(lastRouteSlugWasParameter == true)
                {
                    continue;
                }

                return { match: false, resolved: false };
            }

            const isParameter = slug.startsWith(':');
            if(isParameter == false)
            {
                if(slug != pathArray[i])
                {
                    return { match: false, resolved: false };
                }
            }

            routeMatchesPath = true;
            lastRouteSlugWasParameter = isParameter;
        }
        return { match: routeMatchesPath, resolved: true };
    }
    async #openRoutePage(route: RoutePageElement|undefined, path: string)
    {
        this.targetPageRoute = route;

        // handle the case where no route has matched the path
        this.targetPageRoute = this.targetPageRoute || this.defaultRoute;

        // if no route matches, and no default routes are
        // available the navigation will fail
        if(this.targetPageRoute == null)
        {
            return false;
        }

        const opened = await this.targetPageRoute!.open(path);
        if(opened)
        {
            this.currentPageRoute = this.targetPageRoute!;
            this.dispatchEvent(new CustomEvent(PathRouterEvent.Change, { detail: { route: this.targetPageRoute, path } }));
        }
        return opened;
    }
    async #openRouteDialog(route: RouteDialogElement, path: string)
    {
        this.targetDialogRoute = route;

        if(this.targetDialogRoute == null)
        {
            return false;
        }

        const opened = await this.targetDialogRoute.openRoute(path);
        if(opened)
        {
            this.currentDialogRoute = this.targetDialogRoute;
            this.dispatchEvent(new CustomEvent(PathRouterEvent.Change, { detail: { route: this.targetDialogRoute, path } }))
        }
        return opened;
        
    }
    async #closeCurrentRoutePage(): Promise<boolean>
    {
        if(this.currentPageRoute == null) { return true; }
        const closed = await this.currentPageRoute.close();
        if(closed == true)
        {
            this.currentPageRoute = undefined;
        }
        return closed;
    }
    async #closeCurrentRouteDialog(): Promise<boolean>
    {
        if(this.currentDialogRoute == null) { return true; }
        const closed = await this.currentDialogRoute.closeRoute();
        if(closed == true)
        {
            this.currentDialogRoute = undefined;
        }
        return closed;
    }



    // string manipulation
    #splitPath(path: string)
    {
        const pathArray = path.split('#');
        const pathname = pathArray[0];
        const remainingPath = (path.length > 1) ? pathArray[1] : null;
        const remainingPathArray = (remainingPath == null) ? [""] : remainingPath.split('?');
        const hash = (remainingPathArray == null) ? "" : remainingPathArray[0];

        return { pathname, hash };
    }
    destructurePath(path: string)
    {
        let { pathname, hash } = this.#splitPath(path);
        if(pathname.trim() == '' && hash != '')
        {
            const attributePath = this.getAttribute('path') ?? '';
            const { pathname: attributePage } = this.#splitPath(attributePath);
            pathname = attributePage;
        }
        return [ pathname, hash ];
    }
    trimCharacter(value: string, character: string)
    {
        const regex = new RegExp(`^\\${character}|${character}$`, 'gm');
        return value.replace(regex, '');
    }

    // queries and tests

    /**
     * Compare two `URL` objects to determine whether they represet different locations and, if so, whether or not the new location is marked as a replacement change.
     * @param currentLocation a url object representing the current location
     * @param updatedLocation a url object representing the location to compare against
     * @returns `{ hasChanged, isReplacementChange }`: Whether there was a change, and whether history management should add an entry, or replace the last entry.
     */
    compareLocations(currentLocation: URL, updatedLocation: URL)
    {
        let hasChanged = false;
        let isReplacementChange = false;
        
        if(updatedLocation.pathname != currentLocation.pathname)
        {
            hasChanged = true;
        }
        else if(updatedLocation.pathname == currentLocation.pathname && updatedLocation.hash != currentLocation.hash)
        {
            hasChanged = true;
            // if we're not adding a hash or removing a hash from the url,
            // this navigation is a replacement change
            // otherwise, we want to record this change in our navigation history
            if(currentLocation.hash != "" && updatedLocation.hash != "")
            {
                isReplacementChange = true;
            }
        }

        return { hasChanged, isReplacementChange };
    }

    /**
     * Get a key/value pair object with each key being a route-property name (ex: `:id`), and each value being the associated value from the current path value (ex: `123`).
     * @returns A key/value pair object with each route property in the current path.
     */
    getRouteProperties()
    {
        const result: { [key: string]: unknown } = {};
        if(this.currentPageRoute == null) { return {}; }

        const composedPath = this.getAttribute('path') ?? '/';
        
        const pathArray = this.#getFormattedPathArray(composedPath);
        const routePathArray = this.#getFormattedPathArray(this.currentPageRoute.getAttribute('path') ?? '/');

        let preceedingKey: string|undefined = undefined;
        for(let i = 0; i < routePathArray.length; i++)
        {
            const routePathSlug = routePathArray[i];
            if(routePathSlug.startsWith(":"))
            {
                // if first value is a property, just use
                // the first value of the pathArray
                if(preceedingKey == undefined)
                {
                    let value = pathArray[0];
                    if(value.indexOf('#') > -1)
                    {
                        value = value.split('#')[0];
                    }
                    result[this.trimCharacter(routePathSlug, ":")] = value;
                    continue;
                }
                for(let j = 0; j < pathArray.length - 1; j++)
                {
                    const pathSlug = pathArray[j];
                    if(pathSlug == preceedingKey)
                    {
                        let value = pathArray[j + 1];
                        if(value.indexOf('#') > -1)
                        {
                            value = value.split('#')[0];
                        }
                        result[this.trimCharacter(routePathSlug, ":")] = value;
                    }
                }
            }
            preceedingKey = routePathSlug;
        }
        
        return result;

    }

    static getUrlParameters(urlString: string)
    {
        const url = new URL(urlString);
        const targetPath = url.pathname;
        const path = (targetPath.startsWith('/')) ? targetPath.substring(1) : targetPath;
        return this.getPathParameters(path);
    }
    static getPathParameters(path: string)
    {
        const pathArray = path.split('/');
        
        const properties: { [key:string]: string } = {};

        let previousSlug: string|null = null;
        for(let i = 0; i < pathArray.length; i++)
        {
            const slug = pathArray[i];
            if(previousSlug == null)
            {
                previousSlug = slug;
            }
            else
            {
                properties[previousSlug] = slug;
                previousSlug = null;
            }
        }

        return properties;
    }
    
    connectedCallback()
    {
        let parent = this.getRootNode() as Document|ShadowRoot;
        if(parent.adoptedStyleSheets.indexOf(COMPONENT_STYLESHEET) == -1)
        {
            parent.adoptedStyleSheets.push(COMPONENT_STYLESHEET);
        }
    }
    
    static observedAttributes = [ "path" ];
    attributeChangedCallback(attributeName: string, oldValue: string, newValue: string) 
    {
        if(attributeName == "path")
        {
            if(this.isInitialized == true)
            {
                this.#update(newValue, oldValue ?? "");
            }
            else
            {
                this.#toUpdate.push({ newValue, oldValue: oldValue ?? "" });
            }
        }
    }


    /**
     * Adds simple click handling to a parent element that contains all of the 
     * route links that you want to use for the target `<path-router>` element.
     * @param parent An element that will contain every link that should be listened for. If no parent is provided, the document `<body>` will be used.
     * @param linkQuery A query that will be used to de-select all route links. This can be customized for use-cases like nested path routers which may benefit from scoped selectors. By default, the query is `a[data-route],button[data-route]`.
     */
    addRouteLinkClickHandlers(parent?: HTMLElement, linkQuery: string = "a[data-route],button[data-route]")
    {
        parent = parent ?? document.body;
        parent.addEventListener('click', (event) =>
        {
            const targetLink = (event.target as HTMLElement).closest('a[data-route],button[data-route]');
            if(targetLink != null && parent.contains(targetLink))
            {
                // clear existing selection
                const links = [...parent.querySelectorAll(linkQuery)];
                for(let i = 0; i < links.length; i++)
                {
                    links[i].removeAttribute('aria-current');
                }

                const path = (targetLink as HTMLElement).dataset.route!; // if no path attribute, would have been null from query.
                this.setAttribute('path', path);
                targetLink.setAttribute('aria-current', "page");
            }
        });
    }
}
if(customElements.get(COMPONENT_TAG_NAME) == null)
{
    customElements.define(COMPONENT_TAG_NAME, PathRouterElement);
}

class RouteComposition
{
    path: string = "";
    hash: string = "";
    properties: RouteProperties = {};
    isDialogRoute: boolean = true;
}
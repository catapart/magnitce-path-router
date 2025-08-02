import style from './path-router.css?raw';
import { PathRouteEvent, Route, RouteType, RouteProperties } from './route';
import { RouteDialogElement, COMPONENT_TAG_NAME as ROUTEDIALOG_TAG_NAME } from "./route-dialog.route";
import { RoutePageElement, COMPONENT_TAG_NAME as ROUTEPAGE_TAG_NAME } from "./route-page.route";

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

type PropertyValues = { [key: string]: string };
type MatchValues = [ boolean, PropertyValues ];

const COMPONENT_STYLESHEET = new CSSStyleSheet();
COMPONENT_STYLESHEET.replaceSync(style);

const DOMCONTENTLOADED_PROMISE = new Promise((resolve) => document.addEventListener('DOMContentLoaded', resolve));

// export const ROUTEPROPERTY_DEFAULT = 'default';
export const ROUTEPROPERTY_DATA_ATTRIBUTE_KEYWORD = 'property';


export const COMPONENT_TAG_NAME = 'path-router';
export class PathRouterElement extends HTMLElement
{
    
    get routePages()
    {
        return Array.from(this.querySelectorAll(`:scope > ${ROUTEPAGE_TAG_NAME}, ${COMPONENT_TAG_NAME} :not(${COMPONENT_TAG_NAME}) ${ROUTEPAGE_TAG_NAME}`) as NodeListOf<RoutePageElement>, (route: RoutePageElement) => route) as RoutePageElement[];
    }
    get routeDialogs()
    {
        return Array.from(this.querySelectorAll(`:scope > [is="${ROUTEDIALOG_TAG_NAME}"]`) as NodeListOf<RouteDialogElement>, (routeDialog: RouteDialogElement) => routeDialog) as RouteDialogElement[];
    }
    get routes()
    {
        return Array.from(this.querySelectorAll(`:scope > ${ROUTEPAGE_TAG_NAME},${COMPONENT_TAG_NAME} :not(${COMPONENT_TAG_NAME}) ${ROUTEPAGE_TAG_NAME},:scope > [is="${ROUTEDIALOG_TAG_NAME}"]`) as NodeListOf<Route>, (route: Route) => route) as Route[];
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


    #activationPromise?: Promise<void>;
    #toUpdate: {newValue: string, oldValue: string}[] = [];
    #resolveNavigation?: () => void;

    /**
     * Navigate to a route path.
     * @param path route path
     */
    async navigate(path: string)
    {
        return new Promise<void>((resolve) =>
        {
            this.#resolveNavigation = resolve;
            this.setAttribute('path', path);
        });
    }
    
    /**
     * Adds simple click handling to a parent element that contains all of the 
     * route links that you want to use for the target `<path-router>` element.
     * @param parent An element that will contain every link that should be listened for. If no parent is provided, the document `<body>` will be used.
     * @param linkQuery A query that will be used to de-select all route links. This can be customized for use-cases like nested path routers which may benefit from scoped selectors. By default, the query is `a[data-route],button[data-route]`.
     */
    addRouteLinkClickHandlers(parent?: HTMLElement|ShadowRoot|(HTMLElement|ShadowRoot)[], linkQuery: string = "a[data-route],button[data-route]")
    {
        parent = parent ?? document.body;
        if(!Array.isArray(parent))
        {
            parent = [parent]
        }
        for(let i = 0; i < parent.length; i++)
        {
            parent[i].addEventListener('click', (event) => this.routeLink_onClick(parent[i], event, linkQuery));
        }
    }
    routeLink_onClick(parent: HTMLElement|ShadowRoot, event: Event, linkQuery: string = "a[data-route],button[data-route]")
    {
        let targetLink = event.composedPath().find(item => (item as HTMLElement).dataset?.route != null) as HTMLElement;
        if(targetLink != null)
        {
            // clear existing selection
            const links = [...parent.querySelectorAll(linkQuery)];
            for(let i = 0; i < links.length; i++)
            {
                links[i].removeAttribute('aria-current');
            }

            let path = (targetLink as HTMLElement).dataset.route!; // if no path attribute, would have been null from query.

            // if the route has a variable, and this is in a
            // parent route element, values are substituted
            // if they have an exact name match.
            if(path.indexOf(':') != -1)
            {
                let parentRoute: Element|null|undefined = targetLink.closest('route-page,[is="route-dialog"]');
                while(parentRoute != null)
                {
                    const parentProperties = (parentRoute as RoutePageElement).getProperties();
                    const linkProperties = path.split('/').filter(item => item.startsWith(':'));
                    for(let i = 0; i < linkProperties.length; i++)
                    {
                        const linkPropertyName = linkProperties[i].substring(1);
                        if(parentProperties[linkPropertyName] != null)
                        {
                            path = path.replace(`:${linkPropertyName}`, parentProperties[linkPropertyName]);
                        }
                    }
                    parentRoute = parentRoute.parentElement?.closest('route-page,[is="route-dialog"]');
                }
            }


            // if this link is only made to open a dialog
            // the path shouldn't change the page route,
            // instead, it should only change the dialog route
            if(path.startsWith('#'))
            {
                const currentPath = this.path ?? "";
                const currentPathArray = currentPath.split('#');
                currentPathArray[1] = path.substring(1);
                path = currentPathArray.join('#');
            }

            this.setAttribute('path', path);
            targetLink.setAttribute('aria-current', "page");
        }
    }

    getRouteProperties(route?: Route): RouteProperties
    {
        if(route != null) { return route.getProperties(); }
        const properties = {};
        for(let i = 0; i < this.routes.length; i++)
        {
            const route = this.routes[i];
            Object.assign(properties, route.getProperties());
        }
        return properties;
    }


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
    

    async #update(path: string, previousPath: string)
    {
        if(this.#isActivated == false) { throw new Error("Unable to update path-router before activation."); }

        const sanitizedPath = path.startsWith('/') ? path.substring(1) : path;
        const [ pagePath, dialogPath ] = this.#getTypedPaths(sanitizedPath);
        const [ currentPagePath, currentDialogPath ]= this.#getTypedPaths(previousPath);
        
        let openedPage = false;
        let openedDialog = false;

        // if we're only navigating the dialog route, we don't need to indicate that the empty
        // route used for the page is a direction to set the route to the default.
        // otherwise, if the pages don't match, it's a page change.
        const pageHasChanged = (dialogPath != "" && pagePath == "") ? false : currentPagePath != pagePath;
        const hashHasChanged = dialogPath != currentDialogPath;
        const currentlyOpen = this.querySelector('[open]');
        if(pageHasChanged == false && hashHasChanged == false && currentlyOpen != null)
        {
            if(this.#resolveNavigation != null)
            { 
                this.#resolveNavigation();
                this.#resolveNavigation = undefined;
            }
            currentlyOpen.dispatchEvent(new CustomEvent(PathRouteEvent.Refresh, { detail: { path }, bubbles: true, cancelable: true }));
            return [ openedPage, openedDialog ];
        }
        
        // await any currently running processes
        await this.#awaitAllRouteProcesses();

        // find routes by path
        const matchingRoutes = this.#findMatchingRoutes(sanitizedPath);
        let matchingPageRoutes = matchingRoutes.filter(item => item.route instanceof RoutePageElement);
        const matchingDialogRoutes = matchingRoutes.filter(item => item.route instanceof RouteDialogElement);
        let openPagePromise: Promise<boolean> = new Promise(resolve => resolve(false));

        // if more than one route matched at the same nesting depth
        // and one of them is strictly a property route (path=":propertyName"),
        // the property-only route should be ignored so that a default route can
        // be matched without also matching the property
        matchingPageRoutes = this.#filterPropertyRoutes(matchingPageRoutes);

        let hasClosedPages = false;
        const pagesToRemainOpen = matchingPageRoutes.map(item => item.route);
        if(pageHasChanged == true || currentlyOpen == null)
        {
            // close the route that is currently open
            const closed = await this.#closeCurrentRoutePages(pagesToRemainOpen);
            if(closed == false) 
            {
                // if closing the current route failed, router
                // assumes the implementer prevented navigation.
                console.warn('Navigation was prevented.');
                console.info(`Requested path: ${path}`);
                
                if(this.#resolveNavigation != null)
                { 
                    this.#resolveNavigation();
                    this.#resolveNavigation = undefined;
                }

                return false; 
            }
            hasClosedPages = true;

            for(let i = 0; i < matchingPageRoutes.length; i++)
            {
                const routeData = matchingPageRoutes[i];
                openPagePromise = this.#openRoutePage(routeData.route, dialogPath);
                this.#assignRouteProperties(routeData.route, routeData.properties);
            }
        }


        if(pageHasChanged || currentDialogPath != dialogPath)
        {
            // close any dialog routes that were open and are not currently matching
            const closed = await this.#closeCurrentRouteDialogs(matchingDialogRoutes.map(item => item.route));
            // if closing the current route failed, router
            // assumes the implementer prevented navigation.
            if(closed != false) 
            {
                for(let i = 0; i < matchingDialogRoutes.length; i++)
                {
                    const routeData = matchingDialogRoutes[i];
                    openedDialog = await this.#openRouteDialog(routeData.route, dialogPath);
                    this.#assignRouteProperties(routeData.route, routeData.properties);
                    
                    if(hasClosedPages == false)
                    {
                        const subroutes = [...routeData.route.querySelectorAll('route-page')] as RoutePageElement[];
                        for(let i = 0; i < subroutes.length; i++)
                        {
                            if(pagesToRemainOpen.indexOf(subroutes[i]) > -1) { continue; }
                            await subroutes[i].exit();
                        }
                    }
                }


                // dialog may contain subroutes which would be pages
                for(let i = 0; i < matchingPageRoutes.length; i++)
                {
                    const routeData = matchingPageRoutes[i];
                    if(routeData.route.closest(`[is="${ROUTEDIALOG_TAG_NAME}"][open]`) != null)
                    {
                        openPagePromise = this.#openRoutePage(routeData.route, dialogPath);
                        this.#assignRouteProperties(routeData.route, routeData.properties);
                    }
                }
            }
        }

        openedPage = await openPagePromise; // deferred awaiting because the dialog does not need to await the page opening/transitions

        this.targetPageRoute = undefined;
        this.targetDialogRoute = undefined;
        if(this.#resolveNavigation != null)
        { 
            this.#resolveNavigation();
            this.#resolveNavigation = undefined;
        }

        this.dispatchEvent(new CustomEvent(PathRouterEvent.PathChange, { detail: { sanitizedPath }, bubbles: true, cancelable: true }));
        
        return [ openedPage, openedDialog ];
    }
    #getTypedPaths(path: string)
    {
        const pathArray = path.split('#');
        const pagePath = pathArray[0];
        const remainingPath = (path.length > 1) ? pathArray[1] : null;
        const remainingPathArray = (remainingPath == null) ? [""] : remainingPath.split('?');
        const dialogPath = (remainingPathArray == null) ? "" : remainingPathArray[0];

        return [ pagePath, dialogPath ];
    }
    #findMatchingRoutes(path: string)
    {
        const routes: { route: Route, properties: PropertyValues }[] = [];
        const previousMatches: Route[] = [];
        for(let i = 0; i < this.routes.length; i++)
        {
            const route = this.routes[i];
            const [ routeMatches, properties ] = this.routeMatchesPath(route, path, previousMatches, route instanceof RouteDialogElement);
            if(routeMatches == true)
            {
                routes.push({ route, properties });
                previousMatches.push(route);
            }
        }
        return routes;
    }
    #filterPropertyRoutes(matchingPageRoutes: { route: Route, properties: PropertyValues }[])
    {
        const toRemove: { route: Route, properties: PropertyValues }[] = [];
        for(let i = 0; i < matchingPageRoutes.length; i++)
        {
            const currentMatch =  matchingPageRoutes[i];
            const currentMatchPath = currentMatch.route.getAttribute('path');
            const closestCurrentMatchRouteParent = currentMatch.route.parentElement?.closest('route-page,[is="route-dialog"],path-router');
            
            const comparisonMatch = matchingPageRoutes.find(item =>
            {
                return toRemove.indexOf(item) == -1
                && item != currentMatch
                && item.route.parentElement?.closest('route-page,[is="route-dialog"],path-router') == closestCurrentMatchRouteParent;
            });
            if(comparisonMatch == null) { continue; }

            if(currentMatchPath?.startsWith(':'))
            {
                toRemove.push(currentMatch);
                continue;
            }
            const comparisonMatchPath = comparisonMatch.route.getAttribute('path');
            if(comparisonMatchPath?.startsWith(':'))
            {
                toRemove.push(comparisonMatch);
            }
        }

        const result = matchingPageRoutes.filter(item => toRemove.indexOf(item) == -1);
        return result;
    }
    async #awaitAllRouteProcesses()
    {
        return Promise.allSettled(this.routes.map((route) =>
        {
            return route.currentProcess;
        }));
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

        const opened = await this.targetPageRoute!.enter(path);
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

        const opened = await this.targetDialogRoute.enter(path);
        if(opened)
        {
            this.currentDialogRoute = this.targetDialogRoute;
            this.dispatchEvent(new CustomEvent(PathRouterEvent.Change, { detail: { route: this.targetDialogRoute, path } }))
        }
        return opened;
        
    }
    async #closeCurrentRoutePages(toRemainOpen: RoutePageElement[])
    {
        const openPages = this.routePages.filter(item => item.getAttribute('aria-current') == "page");
        let closed = true;
        for(let i = 0; i < openPages.length; i++)
        {
            if(toRemainOpen.indexOf(openPages[i]) > -1) { continue; }
            closed = (closed == false) ? closed : await openPages[i].exit();
        }
        return closed;
    }
    async #closeCurrentRouteDialogs(toRemainOpen: RouteDialogElement[])
    {
        const openDialogs = this.routeDialogs.filter(item => item.getAttribute('aria-current') == "page");
        let closed = true;
        for(let i = 0; i < openDialogs.length; i++)
        {
            if(toRemainOpen.indexOf(openDialogs[i]) > -1) { continue; }
            closed = (closed == false) ? closed : await openDialogs[i].exit();
        }
        return closed;
    }

    #assignRouteProperties(route: Route, properties: PropertyValues)
    {
        for(const [key, value] of Object.entries<string>(properties))
        {
            const dataKey = ROUTEPROPERTY_DATA_ATTRIBUTE_KEYWORD + key.substring(0, 1).toUpperCase() + key.substring(1);
            route.dataset[dataKey] = value;
        }
    }

    routeMatchesPath(route: Route, queryPath: string, previousMatches: Route[], isDialog = false): MatchValues
    {
        
        // split query path into page and dialog paths
        const queryPathArray = queryPath.split('#');
        const pagePath = queryPathArray[0];
        const dialogPath = (queryPathArray.length > 1) ? queryPathArray[1] : null;

        // break paths into arrays
        const routePath = route.getAttribute('path') ?? "";
        const routePathArray = routePath.split('/');
        const pagePathArray = pagePath.split('/');

        // determine path type;
        // if a route is nested in a dialog, we still want
        // to use the dialog part of the route to handle
        // the matching for that nested route.
        const pathType = route.closest(`[is="${ROUTEDIALOG_TAG_NAME}"]`) == null
        ? 'Page'
        : 'Dialog';

        // handle page path matching
        if(pathType == "Page")
        {
            return this.routeTypeMatches(route, pagePathArray, routePathArray, `${ROUTEPAGE_TAG_NAME}`, previousMatches);
        }
        else if(dialogPath == null)
        {
            return [ false, {} ] ;
        }

        // handle dialog path matching
        const dialogPathArray = dialogPath.split('/');
        return this.routeTypeMatches(route, dialogPathArray, routePathArray, `${ROUTEPAGE_TAG_NAME},[is="${ROUTEDIALOG_TAG_NAME}"]`, previousMatches);
    }

    routeTypeMatches(route: Route, queryPathArray: string[], routePathArray: string[], parentRouteSelector: string, previousMatches: Route[]): MatchValues
    {
        if(queryPathArray.length == 1 && queryPathArray[0].trim() == "")
        {
            return [ (routePathArray.length == 1 && routePathArray[0].trim() == ""), {} ];
        }
        // compose parent paths into a single path (if this is a nested route)
        const parentRoutes = [];
        let parentRoute = route.parentElement?.closest(parentRouteSelector);
        while(parentRoute != null)
        {
            // early exit for nested items; only match if
            // parents have already matched
            if(previousMatches.indexOf(parentRoute as Route) == -1) { return [ false, {} ]; }

            parentRoutes.push(parentRoute);
            parentRoute = parentRoute.parentElement?.closest(parentRouteSelector);
        }
        let composedParentPath = parentRoutes.reverse().reduce((accumulation, item, index) =>
        {
            return `${(accumulation == "") ? "" : accumulation + '/'}${item.getAttribute('path') ?? ""}`;
        }, "");

        // filter out matching parent routes
        const parentRouteArray = composedParentPath.split('/');
        let subrouteArray = [...queryPathArray].filter((item, index) =>
        {
            const parentRouteElement = parentRouteArray[index];
            const parentRouteElementIsProperty = parentRouteElement?.startsWith(':');
            return !(parentRouteElementIsProperty == true || parentRouteElement == item)
        });

        // check if the remaining paths match
        let { match, properties } = this.pathArraySelectsRouteArray(subrouteArray, routePathArray);

        return [ match, properties ];
    }
    
    pathArraySelectsRouteArray(pathArray: string[], routeArray: string[])
    {
        let properties = {} as PropertyValues;
        if(routeArray.length > pathArray.length)
        {
            return { match: false, properties };
        }
        let routeMatchesPath = false;
        for(let i = 0; i < pathArray.length; i++)
        {
            const routeSlug = routeArray[i];
            const pathSlug = pathArray[i];

            if(routeSlug == null)
            {
                return { match: routeMatchesPath, properties };
            }

            const isParameter = routeSlug.startsWith(':');
            if(isParameter == false)
            {
                if(routeSlug != pathSlug)
                {
                    return { match: false, properties };
                }
            }
            else
            {
                properties[routeSlug.substring(1)] = pathSlug;
            }
            routeMatchesPath = true;
        }
        return { match: routeMatchesPath, properties };
    }





    async connectedCallback()
    {
        this.#activationPromise = this.#activateRouteManagement();
        this.#injectStyles();

        await this.#activationPromise;
        await this.#openPreActivationRoutes();

        if(this.getAttribute('path') != null && this.currentPageRoute == null && this.defaultRoute != null)
        {
            this.#openRoutePage(this.defaultRoute, "");
        }
    }
    disconnectedCallback()
    {
        this.#deactivateRouteManagement();
    }

    #isActivated: boolean = false;
    async #activateRouteManagement()
    {
        await DOMCONTENTLOADED_PROMISE;

        this.#assignDefaultRoute();
        this.#addDialogCloseHandlers();

        this.#isActivated = true;
    }
    #assignDefaultRoute()
    {
        this.defaultRoute = this.querySelector('route-page[default]') as RoutePageElement;
        if(this.defaultRoute == null)
        {
            this.defaultRoute = this.querySelector('route-page') as RoutePageElement;
        }
    }
    async #openPreActivationRoutes()
    {
        for(let i = 0; i < this.#toUpdate.length; i++)
        {
            await this.#update(this.#toUpdate[i].newValue, this.#toUpdate[i].oldValue);
        }
    }

    #boundDialogOnCloseHandler = this.#dialog_onClose.bind(this);
    #addDialogCloseHandlers()
    {
        for(let i = 0; i < this.routeDialogs.length; i++)
        {
            this.routeDialogs[i].addEventListener('close', this.#boundDialogOnCloseHandler)
        }
    }
    async #dialog_onClose(event: Event)
    {
        const dialog = event.target as HTMLDialogElement;
        const isExiting = dialog.getAttribute('data-exiting') != null;
        if(!isExiting)
        {
            const pathAttribute = this.getAttribute('path') ?? '/';
            const path = pathAttribute.split('#')[0];
            await this.navigate(path);
        }
        dialog.removeAttribute('data-exiting');
    }

    #deactivateRouteManagement()
    {
        this.#unassignDefaultRoute();
        this.#removeDialogCloseHandler();

        this.#activationPromise = undefined;

        this.#isActivated = false;
    }
    #unassignDefaultRoute()
    {
        if(this.defaultRoute != null) { this.defaultRoute = undefined; }
    }
    #removeDialogCloseHandler()
    {
        this.removeEventListener('close', this.#boundDialogOnCloseHandler);
    }
    

    #injectStyles()
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
            if(this.#isActivated == true)
            {
                this.#update(newValue, oldValue ?? "");
            }
            else
            {
                this.#toUpdate.push({ newValue, oldValue: oldValue ?? "" });
            }
        }
    }
}
if(customElements.get(COMPONENT_TAG_NAME) == null)
{
    customElements.define(COMPONENT_TAG_NAME, PathRouterElement);
}

export { RoutePageElement, RouteDialogElement, Route, RouteType, PathRouteEvent, type RouteProperties }
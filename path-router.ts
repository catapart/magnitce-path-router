import { RouteDialogComponent, COMPONENT_TAG_NAME as ROUTEDIALOG_TAG_NAME } from "./route-dialog";
import { RouteLinkEvent } from "./route-link";
import { PathRouteComponent, COMPONENT_TAG_NAME as ROUTE_TAG_NAME } from "./path-route";

import './route-button';

export enum PathRouterEvent
{
    /** Fires when a route is opened or closed.  */
    Change = 'change',
    /** Fires when the router's path element is updated. */
    PathChange = 'pathchange',
}

export type PathRouterAttributes =
{
    /** The target path for the router to route to. */
    path?: string;
}


const COMPONENT_STYLESHEET = new CSSStyleSheet();
COMPONENT_STYLESHEET.replaceSync(`
path-route
{
    display: none;
}
path-route[open]
{
    display: contents;
}`);

const WILDCARD_INDICATOR = '*';


export const COMPONENT_TAG_NAME = 'path-router';
export class PathRouterComponent extends HTMLElement
{
    get routes()
    {
        return [].map.call(this.querySelectorAll(`:scope > ${ROUTE_TAG_NAME}`) as NodeListOf<PathRouteComponent>, (route: PathRouteComponent) => route) as PathRouteComponent[];
    }
    get routeDialogs()
    {
        return [].map.call(this.querySelectorAll(`:scope > [is="${ROUTEDIALOG_TAG_NAME}"]`) as NodeListOf<RouteDialogComponent>, (routeDialog: RouteDialogComponent) => routeDialog) as RouteDialogComponent[];
    }

    currentPathRoute: PathRouteComponent|undefined;
    currentRouteDialog: RouteDialogComponent|undefined;

    defaultRoute: PathRouteComponent|undefined;
    wildcardRoute: PathRouteComponent|undefined;

    constructor()
    {
        super();
        
        
        window.addEventListener('popstate', async (_event: PopStateEvent) =>
        {
            // event occurs on browser back button;
            const path = window.location.pathname + window.location.hash;
            this.navigate(path);
        });

        this.addEventListener(RouteLinkEvent.Navigate, (async (event: Event|CustomEvent) =>
        {
            const { path } = (event as CustomEvent).detail;
            this.navigate(path);
        }) as EventListener);

        document.addEventListener('DOMContentLoaded', () =>
        {
            // needs to wait for DOM content to know that sub
            // components will be registered.
            this.#init();
        });
    }

    /**
     * Navigate to a route path.
     * @param path route path
     */
    async navigate(path: string)
    {
        const { pathName, hash } = this.destructurePath(path);
        await this.#update(pathName, hash);
        const newPath = `${pathName}${(hash.trim() != '') ? '#':''}${hash}`;
        this.#setPath(newPath);
    }
    getPathElement<T extends HTMLElement, K extends T[] = T[]>(path: string, elements: K)
    {
        const pathArrays = elements.map(element => [element.getAttribute('path') ?? "", element] as [string, HTMLElement]);
        const pathMap: Map<string, HTMLElement> = new Map(pathArrays);

        path = (path.startsWith('/')) ? path.substring(1) : path;
        path = (path.endsWith('/')) ? path.substring(0, path.length-1) : path;

        let foundRoute: HTMLElement|null = null;
        routeLoop:
        for(let [routePath, element] of pathMap)
        {
            routePath = (routePath.startsWith('/')) ? routePath.substring(1) : routePath;
            routePath = (routePath.endsWith('/')) ? routePath.substring(0, routePath.length-1) : routePath;
            const routeArray = routePath.split('/');
            const pathArray = path.split('/');
            
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

                    routeMatchesPath = false;
                    continue routeLoop;
                }

                const isParameter = slug.startsWith(':');
                if(isParameter == false && slug != WILDCARD_INDICATOR)
                {
                    if(slug != pathArray[i])
                    {
                        routeMatchesPath = false
                        continue routeLoop;
                    }
                }

                routeMatchesPath = true;

                lastRouteSlugWasParameter = isParameter;
            }

            // if there are any more slugs in the route that were not
            // requested by the path, they must all be parameters
            for(let i = pathArray.length; i < routeArray.length; i++)
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

    splitPath(path: string)
    {
        const pathArray = path.split('#');
        const pathName = pathArray[0];
        const subPath = (path.length > 1) ? pathArray[1] : null;
        const subPathArray = (subPath == null) ? [""] : subPath.split('?');
        const hash = (subPathArray == null) ? "" : subPathArray[0];

        return { path: pathName, hash };
    }
    destructurePath(path: string)
    {
        let { path: pathName, hash } = this.splitPath(path);
        if(pathName.trim() == '' && hash != '')
        {
            const attributePath = this.getAttribute('path') ?? '';
            const { path: attributePathname } = this.splitPath(attributePath);
            pathName = attributePathname;
        }
        pathName = (pathName.trim() == "") ? "/" : pathName;
        return { pathName, hash };
    }
    
    pathIsActive(path: string)
    {
        let { path: queryPath, hash: queryHash } = this.splitPath(path);
        queryPath = (queryPath.startsWith('/')) ? queryPath.substring(1) : queryPath;
        queryHash = (queryHash.startsWith('#')) ? queryHash.substring(1) : queryHash;

        let routerFullPath = this.getAttribute('path') ?? "/";
        let { path: routerComparePath, hash: routerCompareHash } = this.splitPath(routerFullPath);
        routerComparePath = (routerComparePath.startsWith('/')) ? routerComparePath.substring(1) : routerComparePath;
        routerCompareHash = (routerCompareHash.startsWith('#')) ? routerCompareHash.substring(1) : routerCompareHash;

        // console.log(queryPath, routerComparePath, queryHash, routerCompareHash);

        let matchingPath = false;
        if(queryPath == routerComparePath) { matchingPath = true; }
        let matchingHash = false;
        if(queryHash == routerCompareHash) { matchingHash = true; }

        // path matches, and has no hash value
        if(matchingPath == true && path.indexOf('#') == -1)
        {
            return true;
        }
        // path matches, path has a hash value, and hash matches
        if(matchingPath == true && matchingHash == true)
        {
            return true;
        }
        // path has no path value, and the hash matches
        if(path.startsWith('#') && matchingHash == true)
        {
            return true;
        }

        return false;
    }

    async #init()
    {
        const promises: Promise<boolean>[] = [];
        for(let i = 0; i < this.routes.length; i++)
        {
            const route = this.routes[i];
            promises.push(route.close());

            if(this.defaultRoute == null) { this.defaultRoute = route; }
            const path = route.getAttribute('path');
            const isDefault = route.hasAttribute('default');
            if(path != null && path.trim() == "*")
            {
                this.wildcardRoute = route;
            }
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

        await Promise.allSettled(promises);

        if(!this.hasAttribute('manual'))
        {
            return this.navigate(this.getAttribute('path') ?? "");
        }
    }


    async #update(path: string, hash: string)
    {
        const currentPathAttribute = this.getAttribute('path') ?? "";
        const { path: currentPath, hash: currentHash } = this.splitPath(currentPathAttribute);
        
        const pathHasChanged = currentPath != path;
        if(pathHasChanged)
        {
            await this.#openRoute(path);
        }

        // silently set the path attribute so the hash
        // can reference it, but we avoid messy double
        // notifications
        this.setAttribute('path', path);

        if(pathHasChanged || currentHash != hash)
        {
            await this.#openRouteDialog(hash);
        }
    }
    async #openRoute(path: string)
    {
        await Promise.allSettled(this.routes.map((route) =>
        {
            return route.currentProcess;
        }));
        
        const closed = await this.#closeCurrentPathRoute();
        if(closed == false) 
        {
            return false; 
        }

        let route = this.getPathElement<PathRouteComponent>(path, this.routes);
        if(route == null)
        {
            if(this.wildcardRoute != null)
            {
                route = this.wildcardRoute;
            }
        }
        route = route || this.defaultRoute;

        if(route == null)
        {
            return false;
        }

        const opened = await route!.open(path);
        if(opened)
        {
            this.currentPathRoute = route!;
            this.dispatchEvent(new CustomEvent(PathRouterEvent.Change, { detail: { route, path }}))
        }
        return opened;
    }
    async #openRouteDialog(path: string)
    {
        const trimmedPath = (path.startsWith('#')) ? path.substring(1) : path;
        await Promise.allSettled(this.routeDialogs.map((route) =>
        {
            return route.currentProcess;
        }));
        
        const closed = await this.#closeCurrentRouteDialog();
        if(closed == false) 
        {
            return false; 
        }

        const routeDialog = this.getPathElement<RouteDialogComponent>(trimmedPath, this.routeDialogs);

        if(routeDialog == null)
        {
            return false;
        }

        const opened = await routeDialog.openRoute(path);
        if(opened)
        {
            this.currentRouteDialog = routeDialog;
            this.dispatchEvent(new CustomEvent(PathRouterEvent.Change, { detail: { route: routeDialog, path: trimmedPath }}))
        }
        return opened;
    }

    #setPath(path: string)
    {
        this.setAttribute('path', path);
        this.dispatchEvent(new CustomEvent(PathRouterEvent.PathChange, { detail: { path } }));
    }

    async #closeCurrentPathRoute(): Promise<boolean>
    {
        if(this.currentPathRoute == null) { return true; }

        await Promise.allSettled(this.routes.map((route) =>
        {
            return route.currentProcess;
        }));
        const closed = await this.currentPathRoute.close();
        if(closed == true)
        {
            this.currentPathRoute = undefined;
        }
        return closed;
    }

    async #closeCurrentRouteDialog(): Promise<boolean>
    {
        if(this.currentRouteDialog == null) { return true; }

        await Promise.allSettled(this.routeDialogs.map((route) =>
        {
            return route.currentProcess;
        }));
        const closed = await this.currentRouteDialog.closeRoute();
        if(closed == true)
        {
            this.currentRouteDialog = undefined;
        }
        return closed;
    }

    
    connectedCallback()
    {
        let parent = this.getRootNode() as Document|ShadowRoot;
        if(parent.adoptedStyleSheets.indexOf(COMPONENT_STYLESHEET) == -1)
        {
            parent.adoptedStyleSheets.push(COMPONENT_STYLESHEET);
        }
    }
}
if(customElements.get(COMPONENT_TAG_NAME) == null)
{
    customElements.define(COMPONENT_TAG_NAME, PathRouterComponent);
}
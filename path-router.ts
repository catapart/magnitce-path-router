import { RouteDialogComponent, COMPONENT_TAG_NAME as ROUTEDIALOG_TAG_NAME } from "./route-dialog";
import { RouteLinkEvent } from "./route-link";
import { PathRouteComponent, COMPONENT_TAG_NAME as ROUTE_TAG_NAME, RouteProperties } from "./path-route";

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
COMPONENT_STYLESHEET.replaceSync(`path-router { display: block; }
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

    targetRoute: PathRouteComponent|undefined;
    currentRoute: PathRouteComponent|undefined;
    targetRouteDialog: RouteDialogComponent|undefined;
    currentRouteDialog: RouteDialogComponent|undefined;

    defaultRoute: PathRouteComponent|undefined;
    wildcardRoute: PathRouteComponent|undefined;

    get path(): string|null  { return this.getAttribute("path"); }
    set path(value: string)  { this.setAttribute("path", value); }
    subpaths: string[] = [];

    constructor()
    {
        super();
        
        
        // window.addEventListener('popstate', async (_event: PopStateEvent) =>
        // {
        //     // event occurs on browser back button;
        //     const path = window.location.pathname + window.location.hash;
        //     this.navigate(path);
        // });

        this.addEventListener(RouteLinkEvent.Navigate, (async (event: Event|CustomEvent) =>
        {
            const { path } = (event as CustomEvent).detail;
            this.navigate(path);
        }) as EventListener);

        this.addEventListener(PathRouterEvent.PathChange, (event) =>
        {
            if(event.target != this)
            {
                const subpath = (event.target as HTMLElement).getAttribute('path');
                if(subpath != null)
                {
                    this.subpaths.push(subpath);
                }
            }
        })

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
        const [ pathName, hash ] = this.destructurePath(path);
        await this.#update(pathName, hash);
        const newPath = `${pathName}${(hash.trim() != '') ? '#':''}${hash}`;
        this.#setPath(newPath);        
        this.targetRoute = undefined;
        this.targetRouteDialog = undefined;
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
        return [ pathName, hash ];
    }
    
    pathIsActive(path: string)
    {
        let { path: queryPath, hash: queryHash } = this.splitPath(path);
        [ queryPath, queryHash ] = this.stripLeadingCharacters(queryPath, queryHash);
        // queryPath = (queryPath.startsWith('/')) ? queryPath.substring(1) : queryPath;
        // queryHash = (queryHash.startsWith('#')) ? queryHash.substring(1) : queryHash;

        let routerFullPath = this.getAttribute('path') ?? "/";
        let { path: routerComparePath, hash: routerCompareHash } = this.splitPath(routerFullPath);
        [ routerComparePath, routerCompareHash ] = this.stripLeadingCharacters(routerComparePath, routerCompareHash);
        // routerComparePath = (routerComparePath.startsWith('/')) ? routerComparePath.substring(1) : routerComparePath;
        // routerCompareHash = (routerCompareHash.startsWith('#')) ? routerCompareHash.substring(1) : routerCompareHash;

        // console.log(queryPath, routerComparePath, queryHash, routerCompareHash);

        // let matchingPath = false;
        // if(queryPath == routerComparePath) { matchingPath = true; }
        let linkRoute = this.getPathElement<PathRouteComponent>(queryPath, this.routes);
        if(linkRoute == null) { return false; }

        let matchingPath = (this.currentRoute == linkRoute);
        // if(linkRoute.extractSubroute(queryPath) != "") { return false; } // never highlight the subroute link
        if(matchingPath == true)
        {
            // highlight the link, if the parent route already matches, and the link routes to the currently open subroute
            const subroute = linkRoute.extractSubroute(queryPath)
            if(linkRoute.getAttribute('subrouting') != "false" && subroute != "")
            {
                const subrouter = linkRoute.querySelector<PathRouterComponent>(':scope > path-router');
                if(subrouter != null)
                {
                    matchingPath = subrouter.pathIsActive(subroute);
                }
            } 
        }

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


    comparePath(toCompare: string)
    {
        const currentPath = this.getAttribute('path');
        if(currentPath == null) { return {}; }

        const url = new URL(toCompare);
        let [ windowPath, windowHash ] = this.destructurePath(url.pathname + url.hash);
        [ windowPath, windowHash ] = this.stripLeadingCharacters(windowPath, windowHash);
        let [ routePath, routeHash ] = this.destructurePath(currentPath);
        [ routePath, routeHash ] = this.stripLeadingCharacters(routePath, routeHash);        

        const newPath = `/${routePath}${(routeHash != '') ? `#${routeHash}` : ''}${url.search}`;        
        const pathHasChanged = !(windowPath == routePath && windowHash == routeHash);
        const onlyHashChanged = pathHasChanged && (windowPath == routePath && windowHash != '' && routeHash != '');

        return { newPath, pathHasChanged, onlyHashChanged };
    }
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

    stripLeadingCharacters(path: string, hash: string)
    {
        let cleanedPath = path;
        if(cleanedPath.startsWith('/')) { cleanedPath = cleanedPath.substring(1); }
        cleanedPath = cleanedPath.trim();

        let cleanedHash = hash;
        if(cleanedHash.startsWith('#')) { cleanedHash = cleanedHash.substring(1); }
        cleanedHash = cleanedHash.trim();

        return [ cleanedPath, cleanedHash ];
    }

    static getUrlParameters(urlString: string)
    {
        const url = new URL(urlString);
        const targetPath = url.pathname;
        const path = (targetPath.startsWith('/')) ? targetPath.substring(1) : targetPath;
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

    composeRoutePath()
    {
        const path = this.getAttribute('path') ?? "";
        const [ routerPath, routerHash ] = this.destructurePath(path);
        // let composedPathsArray = [routerPath];


        const targetProperties =  {};
        let targetPath = routerPath ?? "";
        let targetHash = routerHash ?? "";
        let targetSubroutePath = "";
        let targetSubrouteHash = "";

        const route =  this.targetRoute ?? this.currentRoute;
        if(route != null)
        {
            Object.assign(targetProperties, route.currentProperties);
            const routePathAttribute = route.getAttribute('path') ?? "";
            const [ routePath, routeHash ] = this.destructurePath(routePathAttribute);
            
            // console.log(routerPath, routerHash, routePath, routeHash);
            const subrouter = (route.querySelector('path-router') as PathRouterComponent);
            if(subrouter != null)
            {
                const subrouteFullPath = subrouter.composeRoutePath();
                [ targetSubroutePath, targetSubrouteHash ] = this.destructurePath(subrouteFullPath);
                const subroute = subrouter.targetRoute ?? subrouter.currentRoute;
                if(subroute != null)
                {
                    Object.assign(targetProperties, subroute.currentProperties);
                }
                // console.log(subrouteFullPath, subroutePath, subrouteHash);
            }

            targetPath = routePath ?? targetPath;
            targetHash = (routeHash.trim() == "") ? targetHash : routeHash;
        }
        
        const dialogRoute = this.targetRouteDialog ?? this.currentRouteDialog;
        if(dialogRoute != null)
        {
            const dialogRouteProperties = dialogRoute.currentProperties ?? {};
            Object.assign(targetProperties, dialogRouteProperties);

            const dialogSubrouter = (dialogRoute.querySelector('path-router') as PathRouterComponent);
            let dialogSubroutePath = "";
            if(dialogSubrouter != null)
            {
                const dialogSubrouteFullPath = dialogSubrouter.composeRoutePath();
                [ dialogSubroutePath ] = this.destructurePath(dialogSubrouteFullPath);
                const dialogSubroute = dialogSubrouter.targetRoute ?? dialogSubrouter.currentRoute;
                if(dialogSubroute != null)
                {
                    Object.assign(dialogRouteProperties, dialogSubroute.currentProperties);
                }
                // console.log(dialogSubrouteFullPath, dialogSubroutePath);
            }

            targetHash += (dialogSubroutePath.trim() == "") ? '' : `/${dialogSubroutePath}`;
        }
        

        return this.#composeRoutePath(targetPath, targetHash, targetSubroutePath, targetSubrouteHash, targetProperties);
    }
    #composeRoutePath(path: string, hash: string, subroutePath: string, subrouteHash: string, properties: RouteProperties)
    {
        const pathArray = path.split('/');
        const subpathArray = subroutePath.split('/');
        const replaceLastPathSlug = pathArray[pathArray.length - 1].startsWith(':');

        const hashArray = hash.split('/');
        const subhashArray = subrouteHash.split('/');
        const replaceLastHashSlug = hashArray[hashArray.length - 1].startsWith(':');

        for(const [key, value] of Object.entries(properties))
        {
            const pathIndex = pathArray.indexOf(`:${key}`);
            if(pathIndex > -1) { pathArray[pathIndex] = value; }
            const subpathIndex = subpathArray.indexOf(`:${key}`);
            if(subpathIndex > -1) { subpathArray[subpathIndex] = value; }
            
            const hashIndex = hashArray.indexOf(`:${key}`);
            if(hashIndex > -1) { hashArray[hashIndex] = value; }
            const subhashIndex = subhashArray.indexOf(`:${key}`);
            if(subhashIndex > -1) { subhashArray[subhashIndex] = value; }
        }
        if(replaceLastPathSlug == true)
        {
            pathArray[pathArray.length - 1] = subpathArray[0];
            subpathArray.shift();
        }
        if(replaceLastHashSlug == true)
        {
            hashArray[hashArray.length - 1] = subhashArray[0];
            subhashArray.shift();
        }

        const fullPathArray = pathArray.concat(subpathArray);
        path = fullPathArray.join('/');
        
        const fullHashArray = hashArray.concat(subhashArray).filter(item => item.trim() != "");
        const fullHashPath = fullHashArray.join('/');
        if(fullHashPath.trim() != "")
        {
            path = path.endsWith('/') ? path.substring(0, path.length - 1) : path;
            path += `#${fullHashPath}`;
        }
        path = path.replace('//', '/');


        return path;
    }
    composeRoutePath_old()
    {
        let path = this.getAttribute('path') ?? "";
        let pathHash = path.indexOf('#') != -1 ? path.substring(path.indexOf('#') + 1) : path;
        const route = this.targetRoute ?? this.currentRoute;
        if(route == null) { return path; }
        path = route.getAttribute('path') ?? path;
        // console.log(pathHash);

        const subrouter = (route.querySelector('path-router') as PathRouterComponent);
        if(subrouter == null) { return path; }
        let subpath = subrouter.composeRoutePath();
        let subpathHash = subpath.indexOf('#') != -1 ? subpath.substring(subpath.indexOf('#') + 1) : subpath;

        // console.log(subpathHash);

        const routeParams = route.currentProperties ?? {};
        const subroute = subrouter.targetRoute ?? subrouter.currentRoute;
        if(subroute != null)
        {
            Object.assign(routeParams, subroute.currentProperties);
        }
        
        const pathArray = path.split('/');
        const subpathArray = subpath.startsWith('/') ? subpath.substring(1).split('/') : subpath.split('/');
        const replaceLastPathSlug = pathArray[pathArray.length - 1].startsWith(':');
        for(const [key, value] of Object.entries(routeParams))
        {
            const pathIndex = pathArray.indexOf(`:${key}`);
            if(pathIndex > -1) { pathArray[pathIndex] = value; }
            const subpathIndex = subpathArray.indexOf(`:${key}`);
            if(subpathIndex > -1) { subpathArray[subpathIndex] = value; }
        }
        if(replaceLastPathSlug == true)
        {
            pathArray[pathArray.length - 1] = subpathArray[0];
            subpathArray.shift();
        }

        const fullPathArray = pathArray.concat(subpathArray);
        path = fullPathArray.join('/');
        path = path.replace('//', '/');

        return path;
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
        this.subpaths = [];
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

        this.targetRoute = this.getPathElement<PathRouteComponent>(path, this.routes);
        if(this.targetRoute == null)
        {
            if(this.wildcardRoute != null)
            {
                this.targetRoute = this.wildcardRoute;
            }
        }
        this.targetRoute = this.targetRoute || this.defaultRoute;

        if(this.targetRoute == null)
        {
            return false;
        }

        const opened = await this.targetRoute!.open(path);
        if(opened)
        {
            this.currentRoute = this.targetRoute!;
            this.dispatchEvent(new CustomEvent(PathRouterEvent.Change, { detail: { route: this.targetRoute, path } }));
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

        this.targetRouteDialog = this.getPathElement<RouteDialogComponent>(trimmedPath, this.routeDialogs);

        if(this.targetRouteDialog == null)
        {
            return false;
        }

        const opened = await this.targetRouteDialog.openRoute(path);
        if(opened)
        {
            this.currentRouteDialog = this.targetRouteDialog;
            this.dispatchEvent(new CustomEvent(PathRouterEvent.Change, { detail: { route: this.targetRouteDialog, path: trimmedPath } }))
        }
        return opened;
    }

    #setPath(path: string)
    {
        this.setAttribute('path', path);
        this.dispatchEvent(new CustomEvent(PathRouterEvent.PathChange, { detail: { path, supaths: this.subpaths }, bubbles: true, cancelable: true }));
    }

    async #closeCurrentPathRoute(): Promise<boolean>
    {
        if(this.currentRoute == null) { return true; }

        await Promise.allSettled(this.routes.map((route) =>
        {
            return route.currentProcess;
        }));
        const closed = await this.currentRoute.close();
        if(closed == true)
        {
            this.currentRoute = undefined;
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
import './route-page';
import './route-dialog';
import './route-link';
import './route-button';

import { RouteDialogComponent, COMPONENT_TAG_NAME as ROUTEDIALOG_TAG_NAME } from "./route-dialog";
import { RoutePageElement, COMPONENT_TAG_NAME as ROUTE_TAG_NAME, RouteProperties } from "./route-page";

export enum PathRouterEvent
{
    /** Fires when a route is opened or closed.  */
    Change = 'change',
    /** Fires when the router's `path` attribute is updated. */
    PathChange = 'pathchange',
    /** Fires when the router's `path` attribute is combined with all subroute paths to update the `composed-path` attribute. */
    PathCompose = 'pathcompose',
}

export type PathRouterAttributes =
{
    /** The target path for the router to route to. */
    path?: string;
    /** The composition of the router's current path along with any subroute paths. */
    get composedPath(): string|undefined;
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

const WILDCARD_INDICATOR = '*';


export const COMPONENT_TAG_NAME = 'path-router';
export class PathRouterElement extends HTMLElement
{
    get routes()
    {
        return Array.from(this.querySelectorAll(`:scope > ${ROUTE_TAG_NAME}`) as NodeListOf<RoutePageElement>, (route: RoutePageElement) => route) as RoutePageElement[];
    }
    get routeDialogs()
    {
        return Array.from(this.querySelectorAll(`:scope > [is="${ROUTEDIALOG_TAG_NAME}"]`) as NodeListOf<RouteDialogComponent>, (routeDialog: RouteDialogComponent) => routeDialog) as RouteDialogComponent[];
    }

    targetPageRoute: RoutePageElement|undefined;
    currentPageRoute: RoutePageElement|undefined;
    targetDialogRoute: RouteDialogComponent|undefined;
    currentDialogRoute: RouteDialogComponent|undefined;

    defaultRoute: RoutePageElement|undefined;
    wildcardRoute: RoutePageElement|undefined;

    get path(): string|null  { return this.getAttribute("path"); }
    set path(value: string)  { this.setAttribute("path", value); }
    subpaths: string[] = [];
    subrouting: boolean = true;

    isInitialized: boolean = false;
    #initializationPromise: Promise<void>;
    #toUpdate: {newValue: string, oldValue: string}[] = [];

    #routeMap_pathToPage: Map<string, RoutePageElement|RouteDialogComponent> = new Map();
    #routeMap_pathToDialog: Map<string, RouteDialogComponent|RoutePageElement> = new Map();
    #routeMap_pathToPageOrDialog: Map<string, RoutePageElement|RouteDialogComponent> = new Map();

    resolveNavigation?: () => void;

    constructor()
    {
        //todo:
        // add inline documentation
        super();

        this.addEventListener(PathRouterEvent.PathChange, (event) =>
        {
            if(event.target != this)
            {
                this.#updateComposedPath();
            }
        })

        this.#initializationPromise = this.#init();
        this.#dispatchInitialNavigation();
    }
    async #init()
    {
        return new Promise<void>(resolve =>
        {
            document.addEventListener('DOMContentLoaded', async () =>
            {
                // const promises: Promise<boolean>[] = [];
                for(let i = 0; i < this.routes.length; i++)
                {
                    const route = this.routes[i];
                    // promises.push(route.close());

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

                // await Promise.allSettled(promises);

                const subrouters = [...this.querySelectorAll('path-router')] as PathRouterElement[];
                for(let i = 0; i < subrouters.length; i++)
                {
                    subrouters[i].toggleAttribute('subrouter', true);
                }

                

                this.#routeMap_pathToPage = new Map(this.routes
                .map(element => [element.getAttribute('path') ?? "", element] as [string, RoutePageElement|RouteDialogComponent]));
                
                this.#routeMap_pathToDialog = new Map(this.routeDialogs
                .map(element => [element.getAttribute('path') ?? "", element] as [string, RouteDialogComponent|RoutePageElement]));
                
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
        // console.log(this.id, pathName, hash);
        // await this.#update(path);
        // const newPath = `${pathName}${(hash.trim() != '') ? '#':''}${hash}`;
        // this.#setPath(newPath);        
        // this.targetRoute = undefined;
        // this.targetRouteDialog = undefined;

        // return this.navigationPromise;
    }
    async subnavigate(path: string)
    {
        this.toggleAttribute('subnavigating', true);
        return this.navigate(path);
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
        if(pageHasChanged == false && hashHasChanged == false && this.querySelector('[open]') != null)
        {
            if(this.resolveNavigation != null)
            { 
                this.resolveNavigation();
                this.resolveNavigation = undefined;
            }
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
        this.#updateComposedPath();

        this.removeAttribute('subnavigating');

        this.dispatchEvent(new CustomEvent(PathRouterEvent.PathChange, { detail: { path, supaths: this.subpaths }, bubbles: true, cancelable: true }));
        
        return [ openedPage, openedDialog ];
    }
    async #updateComposedPath()
    {
        const previousComposedPath = this.getAttribute('composedPath');
        const composedPath = this.composeRoutePath();
        this.setAttribute('composed-path', composedPath);
        if(this.getAttribute('subrouter') == null)
        {
            this.dispatchEvent(new CustomEvent(PathRouterEvent.PathCompose, { detail: { composedPath, previousComposedPath }, bubbles: true, cancelable: true }));
        }
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

        let foundDialog: RouteDialogComponent|undefined = undefined;
        if(dialogPath != "")
        {
            const dialogPathArray = this.#getFormattedPathArray(dialogPath);
            foundDialog = this.#getRouteElement<RouteDialogComponent>(dialogPathArray, this.#routeMap_pathToDialog);
        }

        return [ foundPage, foundDialog ] as [RoutePageElement, RouteDialogComponent];
    }
    #getFormattedPathArray(path: string)
    {
        path = this.trimCharacter(path, '/');
        return path.split('/');
    }
    #getRouteElement<T extends RoutePageElement|RouteDialogComponent>(pagePathArray: string[], routeMap: Map<string, RoutePageElement|RouteDialogComponent>)
    {
        let foundRoute: RoutePageElement|RouteDialogComponent|undefined = undefined;

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
            if(isParameter == false && slug != WILDCARD_INDICATOR)
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
        if(this.targetPageRoute == null && this.wildcardRoute != null)
        {
            this.targetPageRoute = this.wildcardRoute;
        }
        this.targetPageRoute = this.targetPageRoute || this.defaultRoute;

        // if no route matches, and no default/wildcard routes are
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
    async #openRouteDialog(route: RouteDialogComponent, path: string)
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

    composeRoutePath()
    {
        const path = this.getAttribute('path') ?? "";
        let [ routerPagePath, routerDialogPath ] = this.destructurePath(path);

        let composition = new RouteComposition();
        composition.path = routerPagePath;
        composition.hash = routerDialogPath;
        const routePage = this.targetPageRoute ?? this.currentPageRoute;
        if(routePage != null)
        {
            composition = this.#getCurrentPageRouteComposition(routePage, composition);
        }
        const routeDialog = this.targetDialogRoute ?? this.currentDialogRoute;
        if(routeDialog != null)
        {
            composition.isDialogRoute = false;
            composition = this.#getCurrentDialogRouteComposition(routeDialog, composition);
        }

        return this.#composeRoutePath(composition.path, composition.hash, composition.subroutePath, composition.subrouteHash, composition.properties);
    }
    #getCurrentPageRouteComposition(route: RoutePageElement|null|undefined, composition: RouteComposition = new RouteComposition())
    {
        if(route != null)
        {
            Object.assign(composition.properties, route.currentProperties);
            const routePathAttribute = route.getAttribute('path') ?? "";
            const [ routePath, routeHash ] = this.destructurePath(routePathAttribute);

            composition.path = routePath ?? composition.path;
            composition.hash = (routeHash.trim() == "") ? composition.hash : routeHash;
            
            // console.log(routerPath, routerHash, routePath, routeHash);
            const subrouter = (route.querySelector('path-router') as PathRouterElement);
            if(subrouter != null)
            {
                const subrouteFullPath = subrouter.composeRoutePath();
                let subrouteHash = "";
                [ composition.subroutePath, subrouteHash ] = this.destructurePath(subrouteFullPath);
                if(composition.isDialogRoute == true)
                {
                    composition.subrouteHash = subrouteHash;
                }
                const subroute = subrouter.targetPageRoute ?? subrouter.currentPageRoute;
                if(subroute != null)
                {
                    Object.assign(composition.properties, subroute.currentProperties);
                }
                // console.log(subrouteFullPath, subroutePath, subrouteHash);
            }
        }
        return composition;
    }
    #getCurrentDialogRouteComposition(route: RouteDialogComponent|null|undefined, composition: RouteComposition = new RouteComposition())
    {
        if(route != null)
        {
            Object.assign(composition.properties, route.currentProperties);
            const subrouter = (route.querySelector('path-router') as PathRouterElement);
            if(subrouter != null)
            {
                const subrouteFullPath = subrouter.composeRoutePath();
                let [ subroutePath ] = this.destructurePath(subrouteFullPath);
                const subroute = subrouter.targetPageRoute ?? subrouter.currentPageRoute;
                if(subroute != null)
                {
                    Object.assign(composition.properties, subroute.currentProperties);
                }

                let currentPath = route.getAttribute('path')!;                
                subroutePath = currentPath.replace(/:[\s\S]*/gm, subroutePath);
                subroutePath = this.trimCharacter(subroutePath, "/");
                
                const subroutePathArray = subroutePath.split('/');

                let hashArray = composition.hash.split('/');
                for(let i = 0; i < subroutePathArray.length; i++)
                {
                    if(subroutePathArray[i] == hashArray[i])
                    {
                        continue;
                    }
                    if(hashArray[i] != undefined)
                    {
                        hashArray[i] = subroutePathArray[i];
                    }
                    else
                    {
                        hashArray.push(subroutePathArray[i]);
                    }
                }
                composition.hash = hashArray.join('/');
            }
        }
        return composition;
    }
    #composeRoutePath(path: string, hash: string, subroutePath: string, subrouteHash: string, properties: RouteProperties)
    {
        const pathArray = path.split('/');
        const subpathArray = subroutePath.split('/');
        const replaceLastPathSlug = pathArray[pathArray.length - 1].startsWith(':');

        const hashArray = hash.split('/');
        const subhashArray = subrouteHash.split('/');
        const replaceLastHashSlug = hashArray[hashArray.length - 1].startsWith(':');

        // console.log(pathArray, subpathArray, hashArray, subhashArray);

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
    

    // queries and tests
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

    pathIsActive(path: string)
    {

        const [ queryPath, queryHash ] = this.destructurePath(path);
        let routerFullPath = this.getAttribute('path') ?? "/";
        // let { pathname: routerComparePath, hash: routerCompareHash } = this.#splitPath(routerFullPath);
        const [ routerComparePath, routerCompareHash ] = this.destructurePath(routerFullPath);
        const queryPathArray = this.#getFormattedPathArray(queryPath);
        let linkRoute = (queryPath == "" && routerComparePath == "") ? this.defaultRoute : this.#getRouteElement(queryPathArray, this.#routeMap_pathToPageOrDialog);
        if(linkRoute == null) { return false; }

        let matchingPath = (this.currentPageRoute == linkRoute);
        if(matchingPath == true)
        {
            // highlight the link, if the parent route already matches, and the link routes to the currently open subroute
            const subroute = linkRoute.extractSubroute(queryPath)
            if(linkRoute.getAttribute('subrouting') != "false" && subroute != "")
            {
                const subrouter = linkRoute.querySelector<PathRouterElement>(':scope > path-router');
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

    getRouteProperties(result: { [key: string]: unknown } = {})
    {
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

        const subrouter = this.currentPageRoute.querySelector('path-router') as PathRouterElement;
        if(subrouter != null)
        {
            result = subrouter.getRouteProperties(result);
        }
        
        return result;

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
    
    connectedCallback()
    {
        let parent = this.getRootNode() as Document|ShadowRoot;
        if(parent.adoptedStyleSheets.indexOf(COMPONENT_STYLESHEET) == -1)
        {
            parent.adoptedStyleSheets.push(COMPONENT_STYLESHEET);
        }
    }
    
    static observedAttributes = [ "path", "subrouting" ];
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
        else if(attributeName == "subrouting")
        {
            if(newValue == "false")
            {
                this.subrouting = false;
                for(let i = 0; i < this.routes.length; i++)
                {
                    this.routes[i].setAttribute(attributeName, 'false');
                }
            }
            else
            {
                this.subrouting = true;
                for(let i = 0; i < this.routes.length; i++)
                {
                    this.routes[i].removeAttribute('subrouting');
                }
            }
        }
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
    subroutePath: string = "";
    subrouteHash: string = "";
    properties: RouteProperties = {};
    isDialogRoute: boolean = true;
}
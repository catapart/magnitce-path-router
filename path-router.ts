import style from './path-router.css?raw';
import { Route, RouteType } from './route';
import { RouteDialogElement, COMPONENT_TAG_NAME as ROUTEDIALOG_TAG_NAME } from "./route-dialog.route";
import { RoutePageElement, COMPONENT_TAG_NAME as ROUTE_TAG_NAME } from "./route-page.route";

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
        return Array.from(this.querySelectorAll(`:scope > ${ROUTE_TAG_NAME}`) as NodeListOf<RoutePageElement>, (route: RoutePageElement) => route) as RoutePageElement[];
    }
    get routeDialogs()
    {
        return Array.from(this.querySelectorAll(`:scope > [is="${ROUTEDIALOG_TAG_NAME}"]`) as NodeListOf<RouteDialogElement>, (routeDialog: RouteDialogElement) => routeDialog) as RouteDialogElement[];
    }
    get routes()
    {
        return [...this.routePages, ...this.routeDialogs];
    }

    async navigate(path: string)
    {

    }
    async enterRoute()
    {

    }
    async exitRoute()
    {

    }
    

    #update(path: string)
    {
        for(let i = 0; i < this.routes.length; i++)
        {
            const route = this.routes[i];
            this.#closeRoute(route);
            const [ routeMatches, properties ] = this.routeMatchesPath(route, path, route.classList.contains('dialog'));
            this.#assignRouteProperties(route, properties);
            if(routeMatches == true)
            {
                this.#openRoute(route);
            }
        }
    }

    #openRoute(route: Route)
    {
        // beforeOpenRoute(route);
        // route.classList.add('match');
        route.enter("");
    }
    #assignRouteProperties(route: Route, properties: PropertyValues)
    {
        for(const [key, value] of Object.entries<string>(properties))
        {
            const dataKey = ROUTEPROPERTY_DATA_ATTRIBUTE_KEYWORD + key.substring(0, 1).toUpperCase() + key.substring(1);
            route.dataset[dataKey] = value;
        }
    }
    #closeRoute(route: Route)
    {
        route.classList.remove('match');
    }

    routeMatchesPath(route: Route, queryPath: string, isDialog = false): MatchValues
    {
        // console.log(route, queryPath);
        const routePath = route.getAttribute('path') ?? "";

        // handle special cases / early exits
        if(routePath.trim() == "" || routePath == "/" && isDialog == false)
        {
            return [ (queryPath.trim() == "" || queryPath == "/"), {} ];
        }

        if(routePath.trim() == queryPath.trim() && isDialog == false)
        {
            return [ true, {} ];
        }
        
        // split query path into page and dialog paths
        const queryPathArray = queryPath.split('#');
        const pagePath = queryPathArray[0];
        const dialogPath = (queryPathArray.length > 1) ? queryPathArray[1] : null;

        // break paths into arrays
        const routePathArray = routePath.split('/');
        const pagePathArray = pagePath.split('/');

        // determine path type;
        // if a route is nested in a dialog, we still want
        // to use the dialog part of the route to handle
        // the matching for that nested route.
        const pathType = route.closest('.dialog') == null
        ? 'Page'
        : 'Dialog';

        // handle page path matching
        if(pathType == "Page")
        {
            return this.routeTypeMatches(route, pagePathArray, routePathArray, 'route-page');
        }
        else if(dialogPath == null)
        {
            return [ false, {} ] ;
        }

        // handle dialog path matching
        const dialogPathArray = dialogPath.split('/');
        return this.routeTypeMatches(route, dialogPathArray, routePathArray, '[is="route-dialog"]');
    }

    routeTypeMatches(route: Route, queryPathArray: string[], routePathArray: string[], parentRouteSelector: string): MatchValues
    {
        if(queryPathArray.length == 1 && queryPathArray[0].trim() == "")
        {
            return [ false, {} ];
        }
        // compose parent paths into a single path (if this is a nested route)
        const parentRoutes = [];
        let parentRoute = route.parentElement?.closest(parentRouteSelector);
        while(parentRoute != null)
        {
            // early exit for nested items; only match if
            // parents have already matched
            if(parentRoute.classList.contains('match') == false) { return [ false, {} ]; }

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

    getRouteProperties(route?: Route)
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







    connectedCallback()
    {
        this.activateRouteManagement();
    }
    disconnectedCallback()
    {
        this.deactivateRouteManagement();
    }

    #isActivated: boolean = false;
    async activateRouteManagement()
    {
        await DOMCONTENTLOADED_PROMISE;
        this.#isActivated = true;

        if(this.hasAttribute('debug'))
        {
            console.info('Activated Router');
        }
    }
    async deactivateRouteManagement()
    {
        this.#isActivated = false;
        if(this.hasAttribute('debug'))
        {
            console.info('Deactivated Router');
        }
    }
    
    
    static observedAttributes = [ "path" ];
    attributeChangedCallback(attributeName: string, oldValue: string, newValue: string) 
    {
        if(attributeName == "path")
        {
            if(this.#isActivated == true)
            {
                this.#update(newValue);
            }
            // else
            // {
            //     this.#toUpdate.push({ newValue, oldValue: oldValue ?? "" });
            // }
        }
    }
}
if(customElements.get(COMPONENT_TAG_NAME) == null)
{
    customElements.define(COMPONENT_TAG_NAME, PathRouterElement);
}
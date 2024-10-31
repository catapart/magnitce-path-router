declare enum PathRouteEvent {
    BeforeOpen = "beforeopen",
    AfterOpen = "afteropen",
    BeforeClose = "beforeclose",
    AfterClose = "afterclose"
}
type RouteProperties = {
    [key: string]: string;
};
declare class RoutePageElement extends HTMLElement {
    #private;
    get router(): PathRouterElement | null;
    private blockingBeforeOpen;
    private blockingAfterOpen;
    private blockingBeforeClose;
    private blockingAfterClose;
    currentProcess: Promise<void>;
    canBeOpened: () => Promise<boolean>;
    canBeClosed: () => Promise<boolean>;
    subrouting: boolean;
    currentProperties: RouteProperties | undefined;
    constructor();
    open(path: string): Promise<boolean>;
    close(): Promise<boolean>;
    getProperties(targetPath: string): RouteProperties;
    extractSubroute(targetPath: string): string;
    applyEventListener<K extends (keyof HTMLElementEventMap | 'beforeopen' | 'afteropen' | 'beforeclose' | 'afterclose')>(type: K, listener: (this: HTMLElement, ev: Event | CustomEvent) => void | Promise<void>, options?: boolean | AddEventListenerOptions | undefined): void;
    addBlockingEventListener(eventName: PathRouteEvent, handler: () => void | Promise<void>): void;
    applyBlockingEventListener(eventName: PathRouteEvent, handler: () => void | Promise<void>): void;
}

declare class RouteDialogElement extends HTMLDialogElement {
    #private;
    get router(): PathRouterElement | null;
    private blockingBeforeOpen;
    private blockingAfterOpen;
    private blockingBeforeClose;
    private blockingAfterClose;
    currentProcess: Promise<void>;
    canBeOpened: () => Promise<boolean>;
    canBeClosed: () => Promise<boolean>;
    currentProperties: RouteProperties | undefined;
    constructor();
    openRoute(path: string): Promise<boolean>;
    closeRoute(): Promise<boolean>;
    getProperties(targetPath: string): RouteProperties;
    extractSubroute(targetPath: string): string;
    applyEventListener<K extends (keyof HTMLElementEventMap | 'beforeopen' | 'afteropen' | 'beforeclose' | 'afterclose')>(type: K, listener: (this: HTMLElement, ev: Event | CustomEvent) => void | Promise<void>, options?: boolean | AddEventListenerOptions | undefined): void;
    addBlockingEventListener(eventName: PathRouteEvent, handler: () => void | Promise<void>): void;
}

declare class RouteLinkElement extends HTMLAnchorElement {
    #private;
    constructor();
    connectedCallback(): void;
    onClick(target: PathRouterElement): void;
    /**
     * An override-able string transformation function for preparing the static path attribute value.
     * @param staticPath the path that is set in the route-link's html
     * @returns a new path that has been transformed to the exact path expected for navigation
     * @description Useful for replacing variables.
     */
    onPreparePath(staticPath: string): string;
}

declare class RouteButtonElement extends HTMLButtonElement {
    #private;
    constructor();
    connectedCallback(): void;
    onClick(target: PathRouterElement): void;
    /**
     * An override-able string transformation function for preparing the static path attribute value.
     * @param staticPath the path that is set in the route-link's html
     * @returns a new path that has been transformed to the exact path expected for navigation
     * @description Useful for replacing variables.
     */
    onPreparePath(staticPath: string): string;
}

declare enum PathRouterEvent {
    /** Fires when a route is opened or closed.  */
    Change = "change",
    /** Fires when the router's `path` attribute is updated. */
    PathChange = "pathchange",
    /** Fires when the router's `path` attribute is combined with all subroute paths to update the `composed-path` attribute. */
    PathCompose = "pathcompose"
}
type PathRouterAttributes = {
    /** The target path for the router to route to. */
    path?: string;
    /** The composition of the router's current path along with any subroute paths. */
    get composedPath(): string | undefined;
};
declare const COMPONENT_TAG_NAME = "path-router";
declare class PathRouterElement extends HTMLElement {
    #private;
    get routes(): RoutePageElement[];
    get routeDialogs(): RouteDialogElement[];
    /** The `<page-route>` element currently being navigated to. */
    targetPageRoute: RoutePageElement | undefined;
    /** The `<page-route>` element that the router currently has open. */
    currentPageRoute: RoutePageElement | undefined;
    /** The `route-dialog` element currently being navigated to. */
    targetDialogRoute: RouteDialogElement | undefined;
    /** The `route-dialog` element that the router currently has open. */
    currentDialogRoute: RouteDialogElement | undefined;
    /** The route that will be selected if no other routes match the current path. */
    defaultRoute: RoutePageElement | undefined;
    /** The path which controls the router's navigation. */
    get path(): string | null;
    set path(value: string);
    isInitialized: boolean;
    resolveNavigation?: () => void;
    constructor();
    /**
     * Navigate to a route path.
     * @param path route path
     */
    navigate(path: string): Promise<void>;
    subnavigate(path: string): Promise<void>;
    destructurePath(path: string): string[];
    trimCharacter(value: string, character: string): string;
    composeRoutePath(): string;
    /**
     * Compare two `URL` objects to determine whether they represet different locations and, if so, whether or not the new location is marked as a replacement change.
     * @param currentLocation a url object representing the current location
     * @param updatedLocation a url object representing the location to compare against
     * @returns `{ hasChanged, isReplacementChange }`: Whether there was a change, and whether history management should add an entry, or replace the last entry.
     */
    compareLocations(currentLocation: URL, updatedLocation: URL): {
        hasChanged: boolean;
        isReplacementChange: boolean;
    };
    /**
     * Determine if a path represents the currently opened route.
     * @param path the path to determine the active state of
     * @returns `true` if the path matches the current route, `false` if the path does not match.
     */
    pathIsActive(path: string): boolean;
    /**
     * Get a key/value pair object with each key being a route-property name (ex: `:id`), and each value being the associated value from the current path value (ex: `123`).
     * @param result A key/value pair object with each route property in the current path. This parameter allows recursion for subrouters and is not necessary for most uses.
     * @returns A key/value pair object with each route property in the current path.
     */
    getRouteProperties(result?: {
        [key: string]: unknown;
    }): {
        [key: string]: unknown;
    };
    static getUrlParameters(urlString: string): {
        [key: string]: string;
    };
    connectedCallback(): void;
    static observedAttributes: string[];
    attributeChangedCallback(attributeName: string, oldValue: string, newValue: string): void;
}

export { COMPONENT_TAG_NAME, type PathRouterAttributes, PathRouterElement, PathRouterEvent, RouteButtonElement, RouteDialogElement, RouteLinkElement, RoutePageElement };

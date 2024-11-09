declare enum PathRouteEvent {
    BeforeOpen = "beforeopen",
    AfterOpen = "afteropen",
    BeforeClose = "beforeclose",
    AfterClose = "afterclose",
    Refresh = "refresh"
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
    getProperties(targetPath?: string | null): RouteProperties;
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
    applyEventListener<K extends (keyof HTMLElementEventMap | 'beforeopen' | 'afteropen' | 'beforeclose' | 'afterclose')>(type: K, listener: (this: HTMLElement, ev: Event | CustomEvent) => void | Promise<void>, options?: boolean | AddEventListenerOptions | undefined): void;
    addBlockingEventListener(eventName: PathRouteEvent, handler: () => void | Promise<void>): void;
}

declare enum PathRouterEvent {
    /** Fires when a route is opened or closed.  */
    Change = "change",
    /** Fires when the router's `path` attribute is updated. */
    PathChange = "pathchange"
}
type PathRouterAttributes = {
    /** The target path for the router to route to. */
    path?: string;
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
    destructurePath(path: string): string[];
    trimCharacter(value: string, character: string): string;
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
     * Get a key/value pair object with each key being a route-property name (ex: `:id`), and each value being the associated value from the current path value (ex: `123`).
     * @returns A key/value pair object with each route property in the current path.
     */
    getRouteProperties(): {
        [key: string]: unknown;
    };
    static getUrlParameters(urlString: string): {
        [key: string]: string;
    };
    static getPathParameters(path: string): {
        [key: string]: string;
    };
    connectedCallback(): void;
    static observedAttributes: string[];
    attributeChangedCallback(attributeName: string, oldValue: string, newValue: string): void;
    /**
     * Adds simple click handling to a parent element that contains all of the
     * route links that you want to use for the target `<path-router>` element.
     * @param parent An element that will contain every link that should be listened for. If no parent is provided, the document `<body>` will be used.
     * @param linkQuery A query that will be used to de-select all route links. This can be customized for use-cases like nested path routers which may benefit from scoped selectors. By default, the query is `a[data-route],button[data-route]`.
     */
    addRouteLinkClickHandlers(parent?: HTMLElement, linkQuery?: string): void;
}

export { COMPONENT_TAG_NAME, type PathRouterAttributes, PathRouterElement, PathRouterEvent, RouteDialogElement, RoutePageElement };

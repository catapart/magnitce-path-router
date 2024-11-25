// path-router.css?raw
var path_router_default = "/* \r\n   Animations will not be awaitable in code if they have a display of none.\r\n   Instead, the routes are stacked in a grid.\r\n */\r\npath-router\r\n,.route-view\r\n{ \r\n    display: var(--router-display, grid);\r\n    grid-template-columns: 1fr;\r\n    grid-template-rows: 1fr;\r\n}\r\n\r\nroute-page\r\n{\r\n    display: var(--route-display, block);\r\n    visibility: hidden;\r\n    grid-row: 1;\r\n    grid-column: 1;\r\n}\r\n/* \r\n   Visibility is visible during the entering and exiting phases\r\n   to allow for animations to be awaited.\r\n */\r\nroute-page[open]\r\n,route-page[data-entering]\r\n,route-page[data-exiting]\r\n{\r\n    visibility: visible;\r\n}\r\n\r\n/* sub routes should respect the visibility of the parent routes */\r\nroute-page:not([open],[data-entering],[data-exiting]) route-page[open]\r\n{\r\n    visibility: inherit;\r\n}";

// route.ts
var RouteType = (elementType = HTMLElement) => {
  return class extends elementType {
    currentProcess = Promise.resolve();
    canBeOpened = async () => true;
    canBeClosed = async () => true;
    getProperties() {
      const dataValues = Object.entries(this.dataset);
      const properties = dataValues.reduce((result, item) => {
        const dataItemName = item[0];
        if (!dataItemName.startsWith(ROUTEPROPERTY_DATA_ATTRIBUTE_KEYWORD)) {
          return result;
        }
        const key = dataItemName[ROUTEPROPERTY_DATA_ATTRIBUTE_KEYWORD.length].toLowerCase() + dataItemName.substring(ROUTEPROPERTY_DATA_ATTRIBUTE_KEYWORD.length + 1);
        const value = item[1];
        result[key] = value;
        return result;
      }, {});
      return properties;
    }
    async enter(path) {
      const canNavigate = await this.canBeOpened();
      if (!canNavigate) {
        console.info("Navigation blocked by validity check.");
        return false;
      }
      this.currentProcess = this.#enter(path);
      await this.currentProcess;
      this.currentProcess = Promise.resolve();
      return true;
    }
    async #enter(path) {
      this.dispatchEvent(new CustomEvent("beforeopen" /* BeforeOpen */, { detail: { path, properties: this.getProperties() } }));
      await Promise.allSettled(this.#blockingBeforeOpen.map((value) => value()));
      this.dataset.entering = "";
      await Promise.allSettled(this.getAnimations({ subtree: true }).map((animation) => animation.finished));
      delete this.dataset.entering;
      this.#open();
      this.dispatchEvent(new Event("afteropen" /* AfterOpen */));
      await Promise.allSettled(this.#blockingAfterOpen.map((value) => value()));
    }
    async #open() {
      this.toggleAttribute("open", true);
      this.setAttribute("aria-current", "page");
    }
    async exit() {
      const canNavigate = await this.canBeClosed();
      if (canNavigate == false) {
        console.info("Navigation blocked by validity check.");
        return false;
      }
      this.currentProcess = this.#exit();
      await this.currentProcess;
      this.currentProcess = Promise.resolve();
      return true;
    }
    async #exit() {
      this.dispatchEvent(new Event("beforeclose" /* BeforeClose */));
      await Promise.allSettled(this.#blockingBeforeClose.map((value) => value()));
      this.dataset.exiting = "";
      this.removeAttribute("open");
      await Promise.all(this.getAnimations({ subtree: true }).map((animation) => animation.finished));
      this.#close();
      delete this.dataset.exiting;
      this.dispatchEvent(new Event("afterclose" /* AfterClose */));
      await Promise.allSettled(this.#blockingAfterClose.map((value) => value()));
    }
    #close() {
      this.toggleAttribute("open", false);
      this.removeAttribute("aria-current");
    }
    #blockingBeforeOpen = [];
    #blockingAfterOpen = [];
    #blockingBeforeClose = [];
    #blockingAfterClose = [];
    applyEventListener(type, listener, options) {
      const isOpen = this.getAttribute("open") != null;
      this.addEventListener(type, listener, options);
      if ((type == "beforeopen" /* BeforeOpen */.toString() || type == "afteropen" /* AfterOpen */.toString()) && isOpen == true) {
        this.dispatchEvent(new Event(type));
      } else if (type == "beforeclose" /* BeforeClose */.toString() || type == "afterclose" /* AfterClose */.toString() && isOpen == false) {
        this.dispatchEvent(new Event(type));
      }
    }
    addBlockingEventListener(eventName, handler) {
      switch (eventName) {
        case "beforeopen" /* BeforeOpen */:
          this.#blockingBeforeOpen.push(handler);
          break;
        case "afteropen" /* AfterOpen */:
          this.#blockingAfterOpen.push(handler);
          break;
        case "beforeclose" /* BeforeClose */:
          this.#blockingBeforeClose.push(handler);
          break;
        case "afterclose" /* AfterClose */:
          this.#blockingAfterClose.push(handler);
          break;
      }
    }
    applyBlockingEventListener(eventName, handler) {
      const isOpen = this.getAttribute("open") != null;
      this.addBlockingEventListener(eventName, handler);
      if ((eventName == "beforeopen" /* BeforeOpen */.toString() || eventName == "afteropen" /* AfterOpen */.toString()) && isOpen == true) {
        this.dispatchEvent(new Event(eventName));
      } else if (eventName == "beforeclose" /* BeforeClose */.toString() || eventName == "afterclose" /* AfterClose */.toString() && isOpen == false) {
        this.dispatchEvent(new Event(eventName));
      }
    }
  };
};

// route-dialog.route.ts
var COMPONENT_TAG_NAME = "route-dialog";
var RouteDialogElement = class extends RouteType(HTMLDialogElement) {
};
if (customElements.get(COMPONENT_TAG_NAME) == null) {
  customElements.define(COMPONENT_TAG_NAME, RouteDialogElement, { extends: "dialog" });
}

// route-page.route.ts
var COMPONENT_TAG_NAME2 = "route-page";
var RoutePageElement = class extends RouteType() {
};
if (customElements.get(COMPONENT_TAG_NAME2) == null) {
  customElements.define(COMPONENT_TAG_NAME2, RoutePageElement);
}

// path-router.ts
var PathRouterEvent = /* @__PURE__ */ ((PathRouterEvent2) => {
  PathRouterEvent2["Change"] = "change";
  PathRouterEvent2["PathChange"] = "pathchange";
  return PathRouterEvent2;
})(PathRouterEvent || {});
var COMPONENT_STYLESHEET = new CSSStyleSheet();
COMPONENT_STYLESHEET.replaceSync(path_router_default);
var DOMCONTENTLOADED_PROMISE = new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve));
var ROUTEPROPERTY_DATA_ATTRIBUTE_KEYWORD = "property";
var COMPONENT_TAG_NAME3 = "path-router";
var PathRouterElement = class extends HTMLElement {
  get routePages() {
    return Array.from(this.querySelectorAll(`:scope > ${COMPONENT_TAG_NAME2}, ${COMPONENT_TAG_NAME3} :not(${COMPONENT_TAG_NAME3}) ${COMPONENT_TAG_NAME2}`), (route) => route);
  }
  get routeDialogs() {
    return Array.from(this.querySelectorAll(`:scope > [is="${COMPONENT_TAG_NAME}"]`), (routeDialog) => routeDialog);
  }
  get routes() {
    return Array.from(this.querySelectorAll(`:scope > ${COMPONENT_TAG_NAME2},${COMPONENT_TAG_NAME3} :not(${COMPONENT_TAG_NAME3}) ${COMPONENT_TAG_NAME2},:scope > [is="${COMPONENT_TAG_NAME}"]`), (route) => route);
  }
  /** The `<page-route>` element currently being navigated to. */
  targetPageRoute;
  /** The `<page-route>` element that the router currently has open. */
  currentPageRoute;
  /** The `route-dialog` element currently being navigated to. */
  targetDialogRoute;
  /** The `route-dialog` element that the router currently has open. */
  currentDialogRoute;
  /** The route that will be selected if no other routes match the current path. */
  defaultRoute;
  /** The path which controls the router's navigation. */
  get path() {
    return this.getAttribute("path");
  }
  set path(value) {
    this.setAttribute("path", value);
  }
  #activationPromise;
  #toUpdate = [];
  #resolveNavigation;
  /**
   * Navigate to a route path.
   * @param path route path
   */
  async navigate(path) {
    return new Promise((resolve) => {
      this.#resolveNavigation = resolve;
      this.setAttribute("path", path);
    });
  }
  /**
   * Adds simple click handling to a parent element that contains all of the 
   * route links that you want to use for the target `<path-router>` element.
   * @param parent An element that will contain every link that should be listened for. If no parent is provided, the document `<body>` will be used.
   * @param linkQuery A query that will be used to de-select all route links. This can be customized for use-cases like nested path routers which may benefit from scoped selectors. By default, the query is `a[data-route],button[data-route]`.
   */
  addRouteLinkClickHandlers(parent, linkQuery = "a[data-route],button[data-route]") {
    parent = parent ?? document.body;
    parent.addEventListener("click", (event) => this.routeLink_onClick(parent, event, linkQuery));
  }
  routeLink_onClick(parent, event, linkQuery = "a[data-route],button[data-route]") {
    let targetLink = event.target.closest("a[data-route],button[data-route]");
    if (targetLink == null && event.target == parent && event.target.shadowRoot != null) {
      targetLink = event.target.shadowRoot.activeElement;
    }
    if (targetLink != null && parent.contains(targetLink)) {
      const links = [...parent.querySelectorAll(linkQuery)];
      for (let i = 0; i < links.length; i++) {
        links[i].removeAttribute("aria-current");
      }
      let path = targetLink.dataset.route;
      if (path.indexOf(":") != -1) {
        let parentRoute = targetLink.closest('route-page,[is="route-dialog"]');
        while (parentRoute != null) {
          const parentProperties = parentRoute.getProperties();
          const linkProperties = path.split("/").filter((item) => item.startsWith(":"));
          for (let i = 0; i < linkProperties.length; i++) {
            const linkPropertyName = linkProperties[i].substring(1);
            if (parentProperties[linkPropertyName] != null) {
              path = path.replace(`:${linkPropertyName}`, parentProperties[linkPropertyName]);
            }
          }
          parentRoute = parentRoute.parentElement?.closest('route-page,[is="route-dialog"]');
        }
      }
      if (path.startsWith("#")) {
        const currentPath = this.path ?? "";
        const currentPathArray = currentPath.split("#");
        currentPathArray[1] = path.substring(1);
        path = currentPathArray.join("#");
      }
      this.setAttribute("path", path);
      targetLink.setAttribute("aria-current", "page");
    }
  }
  /**
   * Compare two `URL` objects to determine whether they represet different locations and, if so, whether or not the new location is marked as a replacement change.
   * @param currentLocation a url object representing the current location
   * @param updatedLocation a url object representing the location to compare against
   * @returns `{ hasChanged, isReplacementChange }`: Whether there was a change, and whether history management should add an entry, or replace the last entry.
   */
  compareLocations(currentLocation, updatedLocation) {
    let hasChanged = false;
    let isReplacementChange = false;
    if (updatedLocation.pathname != currentLocation.pathname) {
      hasChanged = true;
    } else if (updatedLocation.pathname == currentLocation.pathname && updatedLocation.hash != currentLocation.hash) {
      hasChanged = true;
      if (currentLocation.hash != "" && updatedLocation.hash != "") {
        isReplacementChange = true;
      }
    }
    return { hasChanged, isReplacementChange };
  }
  async #update(path, previousPath) {
    if (this.#isActivated == false) {
      throw new Error("Unable to update path-router before activation.");
    }
    const sanitizedPath = path.startsWith("/") ? path.substring(1) : path;
    const [pagePath, dialogPath] = this.#getTypedPaths(sanitizedPath);
    const [currentPagePath, currentDialogPath] = this.#getTypedPaths(previousPath);
    let openedPage = false;
    let openedDialog = false;
    const pageHasChanged = dialogPath != "" && pagePath == "" ? false : currentPagePath != pagePath;
    const hashHasChanged = dialogPath != currentDialogPath;
    const currentlyOpen = this.querySelector("[open]");
    if (pageHasChanged == false && hashHasChanged == false && currentlyOpen != null) {
      if (this.#resolveNavigation != null) {
        this.#resolveNavigation();
        this.#resolveNavigation = void 0;
      }
      currentlyOpen.dispatchEvent(new CustomEvent("refresh" /* Refresh */, { detail: { path }, bubbles: true, cancelable: true }));
      return [openedPage, openedDialog];
    }
    await this.#awaitAllRouteProcesses();
    const matchingRoutes = this.#findMatchingRoutes(sanitizedPath);
    let matchingPageRoutes = matchingRoutes.filter((item) => item.route instanceof RoutePageElement);
    const matchingDialogRoutes = matchingRoutes.filter((item) => item.route instanceof RouteDialogElement);
    let openPagePromise = new Promise((resolve) => resolve(false));
    matchingPageRoutes = this.#filterPropertyRoutes(matchingPageRoutes);
    let hasClosedPages = false;
    const pagesToRemainOpen = matchingPageRoutes.map((item) => item.route);
    if (pageHasChanged == true || currentlyOpen == null) {
      const closed = await this.#closeCurrentRoutePages(pagesToRemainOpen);
      if (closed == false) {
        console.warn("Navigation was prevented.");
        console.info(`Requested path: ${path}`);
        if (this.#resolveNavigation != null) {
          this.#resolveNavigation();
          this.#resolveNavigation = void 0;
        }
        return false;
      }
      hasClosedPages = true;
      for (let i = 0; i < matchingPageRoutes.length; i++) {
        const routeData = matchingPageRoutes[i];
        openPagePromise = this.#openRoutePage(routeData.route, dialogPath);
        this.#assignRouteProperties(routeData.route, routeData.properties);
      }
    }
    if (pageHasChanged || currentDialogPath != dialogPath) {
      const closed = await this.#closeCurrentRouteDialogs(matchingDialogRoutes.map((item) => item.route));
      if (closed != false) {
        for (let i = 0; i < matchingDialogRoutes.length; i++) {
          const routeData = matchingDialogRoutes[i];
          openedDialog = await this.#openRouteDialog(routeData.route, dialogPath);
          this.#assignRouteProperties(routeData.route, routeData.properties);
          if (hasClosedPages == false) {
            const subroutes = [...routeData.route.querySelectorAll("route-page")];
            for (let i2 = 0; i2 < subroutes.length; i2++) {
              if (pagesToRemainOpen.indexOf(subroutes[i2]) > -1) {
                continue;
              }
              await subroutes[i2].exit();
            }
          }
        }
        for (let i = 0; i < matchingPageRoutes.length; i++) {
          const routeData = matchingPageRoutes[i];
          if (routeData.route.closest(`[is="${COMPONENT_TAG_NAME}"][open]`) != null) {
            openPagePromise = this.#openRoutePage(routeData.route, dialogPath);
            this.#assignRouteProperties(routeData.route, routeData.properties);
          }
        }
      }
    }
    openedPage = await openPagePromise;
    this.targetPageRoute = void 0;
    this.targetDialogRoute = void 0;
    if (this.#resolveNavigation != null) {
      this.#resolveNavigation();
      this.#resolveNavigation = void 0;
    }
    this.dispatchEvent(new CustomEvent("pathchange" /* PathChange */, { detail: { sanitizedPath }, bubbles: true, cancelable: true }));
    return [openedPage, openedDialog];
  }
  #getTypedPaths(path) {
    const pathArray = path.split("#");
    const pagePath = pathArray[0];
    const remainingPath = path.length > 1 ? pathArray[1] : null;
    const remainingPathArray = remainingPath == null ? [""] : remainingPath.split("?");
    const dialogPath = remainingPathArray == null ? "" : remainingPathArray[0];
    return [pagePath, dialogPath];
  }
  #findMatchingRoutes(path) {
    const routes = [];
    const previousMatches = [];
    for (let i = 0; i < this.routes.length; i++) {
      const route = this.routes[i];
      const [routeMatches, properties] = this.routeMatchesPath(route, path, previousMatches, route instanceof RouteDialogElement);
      if (routeMatches == true) {
        routes.push({ route, properties });
        previousMatches.push(route);
      }
    }
    return routes;
  }
  #filterPropertyRoutes(matchingPageRoutes) {
    const toRemove = [];
    for (let i = 0; i < matchingPageRoutes.length; i++) {
      const currentMatch = matchingPageRoutes[i];
      const currentMatchPath = currentMatch.route.getAttribute("path");
      const closestCurrentMatchRouteParent = currentMatch.route.parentElement?.closest('route-page,[is="route-dialog"],path-router');
      const comparisonMatch = matchingPageRoutes.find((item) => {
        return toRemove.indexOf(item) == -1 && item != currentMatch && item.route.parentElement?.closest('route-page,[is="route-dialog"],path-router') == closestCurrentMatchRouteParent;
      });
      if (comparisonMatch == null) {
        continue;
      }
      if (currentMatchPath?.startsWith(":")) {
        toRemove.push(currentMatch);
        continue;
      }
      const comparisonMatchPath = comparisonMatch.route.getAttribute("path");
      if (comparisonMatchPath?.startsWith(":")) {
        toRemove.push(comparisonMatch);
      }
    }
    const result = matchingPageRoutes.filter((item) => toRemove.indexOf(item) == -1);
    return result;
  }
  async #awaitAllRouteProcesses() {
    return Promise.allSettled(this.routes.map((route) => {
      return route.currentProcess;
    }));
  }
  async #openRoutePage(route, path) {
    this.targetPageRoute = route;
    this.targetPageRoute = this.targetPageRoute || this.defaultRoute;
    if (this.targetPageRoute == null) {
      return false;
    }
    const opened = await this.targetPageRoute.enter(path);
    if (opened) {
      this.currentPageRoute = this.targetPageRoute;
      this.dispatchEvent(new CustomEvent("change" /* Change */, { detail: { route: this.targetPageRoute, path } }));
    }
    return opened;
  }
  async #openRouteDialog(route, path) {
    this.targetDialogRoute = route;
    if (this.targetDialogRoute == null) {
      return false;
    }
    const opened = await this.targetDialogRoute.enter(path);
    if (opened) {
      this.currentDialogRoute = this.targetDialogRoute;
      this.dispatchEvent(new CustomEvent("change" /* Change */, { detail: { route: this.targetDialogRoute, path } }));
    }
    return opened;
  }
  async #closeCurrentRoutePages(toRemainOpen) {
    const openPages = this.routePages.filter((item) => item.getAttribute("aria-current") == "page");
    let closed = true;
    for (let i = 0; i < openPages.length; i++) {
      if (toRemainOpen.indexOf(openPages[i]) > -1) {
        continue;
      }
      closed = closed == false ? closed : await openPages[i].exit();
    }
    return closed;
  }
  async #closeCurrentRouteDialogs(toRemainOpen) {
    const openDialogs = this.routeDialogs.filter((item) => item.getAttribute("aria-current") == "page");
    let closed = true;
    for (let i = 0; i < openDialogs.length; i++) {
      if (toRemainOpen.indexOf(openDialogs[i]) > -1) {
        continue;
      }
      closed = closed == false ? closed : await openDialogs[i].exit();
    }
    return closed;
  }
  #assignRouteProperties(route, properties) {
    for (const [key, value] of Object.entries(properties)) {
      const dataKey = ROUTEPROPERTY_DATA_ATTRIBUTE_KEYWORD + key.substring(0, 1).toUpperCase() + key.substring(1);
      route.dataset[dataKey] = value;
    }
  }
  routeMatchesPath(route, queryPath, previousMatches, isDialog = false) {
    const queryPathArray = queryPath.split("#");
    const pagePath = queryPathArray[0];
    const dialogPath = queryPathArray.length > 1 ? queryPathArray[1] : null;
    const routePath = route.getAttribute("path") ?? "";
    const routePathArray = routePath.split("/");
    const pagePathArray = pagePath.split("/");
    const pathType = route.closest(`[is="${COMPONENT_TAG_NAME}"]`) == null ? "Page" : "Dialog";
    if (pathType == "Page") {
      return this.routeTypeMatches(route, pagePathArray, routePathArray, `${COMPONENT_TAG_NAME2}`, previousMatches);
    } else if (dialogPath == null) {
      return [false, {}];
    }
    const dialogPathArray = dialogPath.split("/");
    return this.routeTypeMatches(route, dialogPathArray, routePathArray, `${COMPONENT_TAG_NAME2},[is="${COMPONENT_TAG_NAME}"]`, previousMatches);
  }
  routeTypeMatches(route, queryPathArray, routePathArray, parentRouteSelector, previousMatches) {
    if (queryPathArray.length == 1 && queryPathArray[0].trim() == "") {
      return [routePathArray.length == 1 && routePathArray[0].trim() == "", {}];
    }
    const parentRoutes = [];
    let parentRoute = route.parentElement?.closest(parentRouteSelector);
    while (parentRoute != null) {
      if (previousMatches.indexOf(parentRoute) == -1) {
        return [false, {}];
      }
      parentRoutes.push(parentRoute);
      parentRoute = parentRoute.parentElement?.closest(parentRouteSelector);
    }
    let composedParentPath = parentRoutes.reverse().reduce((accumulation, item, index) => {
      return `${accumulation == "" ? "" : accumulation + "/"}${item.getAttribute("path") ?? ""}`;
    }, "");
    const parentRouteArray = composedParentPath.split("/");
    let subrouteArray = [...queryPathArray].filter((item, index) => {
      const parentRouteElement = parentRouteArray[index];
      const parentRouteElementIsProperty = parentRouteElement?.startsWith(":");
      return !(parentRouteElementIsProperty == true || parentRouteElement == item);
    });
    let { match, properties } = this.pathArraySelectsRouteArray(subrouteArray, routePathArray);
    return [match, properties];
  }
  getRouteProperties(route) {
    if (route != null) {
      return route.getProperties();
    }
    const properties = {};
    for (let i = 0; i < this.routes.length; i++) {
      const route2 = this.routes[i];
      Object.assign(properties, route2.getProperties());
    }
    return properties;
  }
  pathArraySelectsRouteArray(pathArray, routeArray) {
    let properties = {};
    if (routeArray.length > pathArray.length) {
      return { match: false, properties };
    }
    let routeMatchesPath = false;
    for (let i = 0; i < pathArray.length; i++) {
      const routeSlug = routeArray[i];
      const pathSlug = pathArray[i];
      if (routeSlug == null) {
        return { match: routeMatchesPath, properties };
      }
      const isParameter = routeSlug.startsWith(":");
      if (isParameter == false) {
        if (routeSlug != pathSlug) {
          return { match: false, properties };
        }
      } else {
        properties[routeSlug.substring(1)] = pathSlug;
      }
      routeMatchesPath = true;
    }
    return { match: routeMatchesPath, properties };
  }
  async connectedCallback() {
    this.#activationPromise = this.#activateRouteManagement();
    this.#injectStyles();
    await this.#activationPromise;
    await this.#openPreActivationRoutes();
    if (this.getAttribute("path") != null && this.currentPageRoute == null && this.defaultRoute != null) {
      this.#openRoutePage(this.defaultRoute, "");
    }
  }
  disconnectedCallback() {
    this.#deactivateRouteManagement();
  }
  #isActivated = false;
  async #activateRouteManagement() {
    await DOMCONTENTLOADED_PROMISE;
    this.#assignDefaultRoute();
    this.#addDialogCloseHandlers();
    this.#isActivated = true;
  }
  #assignDefaultRoute() {
    this.defaultRoute = this.querySelector("route-page[default]");
    if (this.defaultRoute == null) {
      this.defaultRoute = this.querySelector("route-page");
    }
  }
  async #openPreActivationRoutes() {
    for (let i = 0; i < this.#toUpdate.length; i++) {
      await this.#update(this.#toUpdate[i].newValue, this.#toUpdate[i].oldValue);
    }
  }
  #boundDialogOnCloseHandler = this.#dialog_onClose.bind(this);
  #addDialogCloseHandlers() {
    for (let i = 0; i < this.routeDialogs.length; i++) {
      this.routeDialogs[i].addEventListener("close", this.#boundDialogOnCloseHandler);
    }
  }
  async #dialog_onClose(event) {
    const dialog = event.target;
    const isExiting = dialog.getAttribute("data-exiting") != null;
    if (!isExiting) {
      const pathAttribute = this.getAttribute("path") ?? "/";
      const path = pathAttribute.split("#")[0];
      await this.navigate(path);
    }
    dialog.removeAttribute("data-exiting");
  }
  #deactivateRouteManagement() {
    this.#unassignDefaultRoute();
    this.#removeDialogCloseHandler();
    this.#activationPromise = void 0;
    this.#isActivated = false;
  }
  #unassignDefaultRoute() {
    if (this.defaultRoute != null) {
      this.defaultRoute = void 0;
    }
  }
  #removeDialogCloseHandler() {
    this.removeEventListener("close", this.#boundDialogOnCloseHandler);
  }
  #injectStyles() {
    let parent = this.getRootNode();
    if (parent.adoptedStyleSheets.indexOf(COMPONENT_STYLESHEET) == -1) {
      parent.adoptedStyleSheets.push(COMPONENT_STYLESHEET);
    }
  }
  static observedAttributes = ["path"];
  attributeChangedCallback(attributeName, oldValue, newValue) {
    if (attributeName == "path") {
      if (this.#isActivated == true) {
        this.#update(newValue, oldValue ?? "");
      } else {
        this.#toUpdate.push({ newValue, oldValue: oldValue ?? "" });
      }
    }
  }
};
if (customElements.get(COMPONENT_TAG_NAME3) == null) {
  customElements.define(COMPONENT_TAG_NAME3, PathRouterElement);
}
export {
  COMPONENT_TAG_NAME3 as COMPONENT_TAG_NAME,
  PathRouterElement,
  PathRouterEvent,
  ROUTEPROPERTY_DATA_ATTRIBUTE_KEYWORD
};

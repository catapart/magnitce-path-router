// path-router.css?raw
var path_router_default = {};

// route.ts
var RouteType = (elementType = HTMLElement) => {
  return class extends elementType {
    static value = "Hello";
    async enter(path) {
    }
    async #enter(path) {
      this.dispatchEvent(new CustomEvent("beforeopen" /* BeforeOpen */, { detail: { path, properties: this.getProperties() } }));
      this.dataset.entering = "";
      await Promise.allSettled(this.getAnimations({ subtree: true }).map((animation) => animation.finished));
      this.#open();
      this.dispatchEvent(new Event("afteropen" /* AfterOpen */));
    }
    async #open() {
      delete this.dataset.entering;
      this.toggleAttribute("open", true);
      this.setAttribute("aria-current", "page");
    }
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
  };
};

// route-dialog.route.ts
var COMPONENT_TAG_NAME = "route-dialog";
var RouteDialogElement = class extends RouteType(HTMLDialogElement) {
};

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
    return Array.from(this.querySelectorAll(`:scope > ${COMPONENT_TAG_NAME2}`), (route) => route);
  }
  get routeDialogs() {
    return Array.from(this.querySelectorAll(`:scope > [is="${COMPONENT_TAG_NAME}"]`), (routeDialog) => routeDialog);
  }
  get routes() {
    return [...this.routePages, ...this.routeDialogs];
  }
  async navigate(path) {
  }
  async enterRoute() {
  }
  async exitRoute() {
  }
  #update(path) {
    for (let i = 0; i < this.routes.length; i++) {
      const route = this.routes[i];
      this.#closeRoute(route);
      const [routeMatches, properties] = this.routeMatchesPath(route, path, route.classList.contains("dialog"));
      this.#assignRouteProperties(route, properties);
      if (routeMatches == true) {
        this.#openRoute(route);
      }
    }
  }
  #openRoute(route) {
    route.enter("");
  }
  #assignRouteProperties(route, properties) {
    for (const [key, value] of Object.entries(properties)) {
      const dataKey = ROUTEPROPERTY_DATA_ATTRIBUTE_KEYWORD + key.substring(0, 1).toUpperCase() + key.substring(1);
      route.dataset[dataKey] = value;
    }
  }
  #closeRoute(route) {
    route.classList.remove("match");
  }
  routeMatchesPath(route, queryPath, isDialog = false) {
    const routePath = route.getAttribute("path") ?? "";
    if (routePath.trim() == "" || routePath == "/" && isDialog == false) {
      return [queryPath.trim() == "" || queryPath == "/", {}];
    }
    if (routePath.trim() == queryPath.trim() && isDialog == false) {
      return [true, {}];
    }
    const queryPathArray = queryPath.split("#");
    const pagePath = queryPathArray[0];
    const dialogPath = queryPathArray.length > 1 ? queryPathArray[1] : null;
    const routePathArray = routePath.split("/");
    const pagePathArray = pagePath.split("/");
    const pathType = route.closest(".dialog") == null ? "Page" : "Dialog";
    if (pathType == "Page") {
      return this.routeTypeMatches(route, pagePathArray, routePathArray, "route-page");
    } else if (dialogPath == null) {
      return [false, {}];
    }
    const dialogPathArray = dialogPath.split("/");
    return this.routeTypeMatches(route, dialogPathArray, routePathArray, '[is="route-dialog"]');
  }
  routeTypeMatches(route, queryPathArray, routePathArray, parentRouteSelector) {
    if (queryPathArray.length == 1 && queryPathArray[0].trim() == "") {
      return [false, {}];
    }
    const parentRoutes = [];
    let parentRoute = route.parentElement?.closest(parentRouteSelector);
    while (parentRoute != null) {
      if (parentRoute.classList.contains("match") == false) {
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
  connectedCallback() {
    this.activateRouteManagement();
  }
  disconnectedCallback() {
    this.deactivateRouteManagement();
  }
  #isActivated = false;
  async activateRouteManagement() {
    await DOMCONTENTLOADED_PROMISE;
    this.#isActivated = true;
    if (this.hasAttribute("debug")) {
      console.info("Activated Router");
    }
  }
  async deactivateRouteManagement() {
    this.#isActivated = false;
    if (this.hasAttribute("debug")) {
      console.info("Deactivated Router");
    }
  }
  static observedAttributes = ["path"];
  attributeChangedCallback(attributeName, oldValue, newValue) {
    if (attributeName == "path") {
      if (this.#isActivated == true) {
        this.#update(newValue);
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

# `<path-router>`
A custom `HTMLElement` that routes to pages based on its `path` attribute.

Includes subrouting, transitions, events, and dialog routes.

Package size: ~12kb minified, ~25kb verbose.

## Quick Reference
```html
<menu>
    <a data-route="first">Route First</a>
    <a data-route="second">Route Second</a>
    <a data-route="third">Route Third</a>
    <a data-route="fourth">Route Fourth</a>
    <a data-route="fourth/fifth/sixth">Route Fifth</a>
    <a data-route="#dialog/">Route Dialog</a>
    <a data-route="#dialog/second">Route Dialog - Second</a>
    <a data-route="test">No Match Test</a>
</menu>
<path-router path="">
    <route-page path="first">Route First</route-page>
    <route-page path="second">Route Second</route-page>
    <route-page path="third">Route Third</route-page>
    <route-page path="fourth">
        Route Fourth
        <route-page path="fifth/:property">Route Fifth</route-page>
    </route-page>
    <path-router class="subrouter-manages-its-own-routes">
        <route-page path="first" class="never matches"></route-page>
    </path-router>
    <dialog is="route-dialog" path="dialog">
        Dialog
        <route-page>Dialog Default</route-page>
        <route-page path="second">Dialog Second</route-page>
        <form method="dialog"><button>Close</button></form>
    </dialog>
</path-router>
<script type="module" src="/path/to/path-router[.min].js"></script>
<script type="module">
    const router = document.querySelector('path-router');
    document.addEventListener('DOMContentLoaded', () =>
    {
        const linksParent = document.querySelector('menu');
        router.addRouteLinkClickHandlers(linksParent);
    });
</script>
```

## Demos
- General Overview: https://catapart.github.io/magnitce-path-router/demo/
- Navigation using Browser's History API: https://catapart.github.io/magnitce-path-router/demo/active-browser-navigation.html

## Support
- Firefox
- Chrome
- Edge
- <s>Safari</s> (Has not been tested; should be supported, based on custom element support)

## Getting Started
 1. [Install/Reference the library](#referenceinstall)
 1. [Add Routes](#add-routes)
 1. [Add Links](#add-links)
 1. [Await Data](#await-data)
 1. [Await Animations](#await-animations)
 1. [Add a Dialog Route](#add-a-dialog-route)
 1. [Add a Subrouter](#add-a-subrouter)
 1. [Manage History](#manage-history)

### Reference/Install
#### HTML Import (not required for vanilla js/ts; alternative to import statement)
```html
<script type="module" src="/path/to/path-router[.min].js"></script>
```
#### npm
```cmd
npm install @magnit-ce/path-router
```

### Import
#### Vanilla js/ts
```js
import "/path/to/path-router[.min].js"; // if you didn't reference from a <script>, reference with an import like this

import { PathRouter } from "/path/to/path-router[.min].js";
```
#### npm
```js
import "@magnit-ce/path-router"; // if you didn't reference from a <script>, reference with an import like this

import { PathRouter } from "@magnit-ce/path-router";
```

### Add Routes
```html
<path-router path="home">
    <route-page path="home">
        <header>Home</header>
        <div>
            <p>Welcome to the website!</p>
        </div>
    </route-page>
    <route-page path="about">    
        <header>About</header>
        <div>
            <p>About this website:</p>
        </div>
    </route-page>
    <route-page path="contact">    
        <header>Contact</header>
        <div>
            <p>Contact Us:</p>
            <a>contact@mydomain.com</a>
        </div>
    </route-page>
</path-router>
<script type="module" src="/path/to/path-router.min.js"></script>
```

### Add Links
```html
<!-- New -->
<menu>
    <a data-route="home">Home</a>
    <a data-route="about">About</a>
    <a data-route="contact">Contact</a>
</menu>
<!-- End New -->
<path-router path="home">
    <route-page path="home">
        <header>Home</header>
        <div>
            <p>Welcome to the website!</p>
        </div>
    </route-page>
    <route-page path="about">    
        <header>About</header>
        <div>
            <p>About this website:</p>
        </div>
    </route-page>
    <route-page path="contact">    
        <header>Contact</header>
        <div>
            <p>Contact Us:</p>
            <a>contact@mydomain.com</a>
        </div>
    </route-page>
</path-router>
<!-- New -->
<script type="module" src="/path/to/path-router.min.js"></script>
<script type="module">
    // listen for click events
    const router = document.querySelector('path-router');
    router.addRouteLinkClickHandlers();
</script>
<!-- End New -->
```

### Await Data
```js
document.querySelector('route-page[path="home"]').addBlockingEventListener('beforeopen', async () =>
{
    // this handler will prevent the page from opening until it resolves

    appState.welcomeVideo = await fetchVideoContent();
});
```

### Await Animations
```js
document.querySelector('route-page[path="home"]').addEventListener('afteropen', () =>
{
    //this event will fire after the css transition has finished
    startVideoContent(appState.welcomeVideo);
});
```

### Add a Dialog Route
```html
<menu>
    <a data-route="home">Home</a>
    <a data-route="about">About</a>
    <a data-route="contact">Contact</a>
</menu>
<path-router path="home">
    <route-page path="home">
        <header>Home</header>
        <div>
            <p>Welcome to the website!</p>
            <!-- New -->
            <button type="button" data-route="#config">
                Open Config
            </button>
            <!-- End New -->
        </div>
    </route-page>
    <route-page path="about">    
        <header>About</header>
        <div>
            <p>About this website:</p>
        </div>
    </route-page>
    <route-page path="contact">    
        <header>Contact</header>
        <div>
            <p>Contact Us:</p>
            <a>contact@mydomain.com</a>
        </div>
    </route-page>
    <!-- New -->
    <dialog is="route-dialog" path="config">    
        <header>Configuration</header>
        <div>
            <p>User Setttings</p>
        </div>
        <footer>
            <form method="dialog">
                <button>Close</button>
            </form>
        </footer>
    </dialog>
    <!-- End New -->
</path-router>
<script type="module" src="/path/to/path-router.min.js"></script>
<script type="module">
    const router = document.querySelector('path-router');
    router.addRouteLinkClickHandlers();
</script>
```

### Add a Subrouter
```html
<menu>
    <a data-route="home">Home</a>
    <a data-route="about">About</a>
    <a data-route="contact">Contact</a>
</menu>
<path-router path="home">
    <route-page path="home">
        <header>Home</header>
        <div>
            <p>Welcome to the website!</p>
            <button type="button" data-route="#config/">
                Open Config
            </button>
            <!-- New -->
            <button type="button" data-route="#config/app">
                Open App Config
            </button>
            <!-- End New -->
        </div>
    </route-page>
    <route-page path="about">    
        <header>About</header>
        <div>
            <p>About this website:</p>
        </div>
    </route-page>
    <route-page path="contact">    
        <header>Contact</header>
        <div>
            <p>Contact Us:</p>
            <a>contact@mydomain.com</a>
        </div>
    </route-page>
    <dialog is="route-dialog" path="config">    
        <header>Configuration</header>
        <!-- New -->
        <menu>
            <a data-route="#config/">User</a>
            <a data-route="#config/app">App</a>
        </menu>
        <div class="route-view">
            <route-page>
                <header>User</header>
                <div>
                    <p>User Setttings</p>
                </div>
            </route-page>
            <route-page path="app">
                <header>App</header>
                <div>
                    <p>App Setttings</p>
                </div>
            </route-page>
        </div>
        <!-- End New -->
        <footer>
            <form method="dialog">
                <button>Close</button>
            </form>
        </footer>
    </dialog>
</path-router>
<script type="module" src="/path/to/path-router.min.js"></script>
<script type="module">
    const router = document.querySelector('path-router');
    router.addRouteLinkClickHandlers();
</script>
```

### Manage History
```js
const pageRouter = document.querySelector('path-router');

// monitor window history to update routes
let historyIsUpdating = false;
window.addEventListener('popstate', async (event) =>
{
    historyIsUpdating = true;
    const route = window.location.pathname + window.location.hash;
    await pageRouter.navigate(route);
    historyIsUpdating = false;
});

// monitor path changes on path-router
// element, to set new url paths
pageRouter.addEventListener('pathchange', pageRouter_onPathChange);
function pageRouter_onPathChange(event)
{
    // if we're moving back or forward,
    // we don't want to record that in history
    // and the browser will update the url
    if(historyIsUpdating == true) { return; } 
    
    const currentLocation = window.location;
    let updatedPath = pageRouter.getAttribute('path');
    const origin = window.location.origin;
    const updatedLocation = new URL(`${origin}/${updatedPath}`);

    const { hasChanged, isReplacementChange } = pageRouter.compareLocations(currentLocation, updatedLocation);
    if(hasChanged)
    {
        if(isReplacementChange)
        {
            window.history.replaceState(null, '', updatedLocation.href);
        }
        else
        {
            window.history.pushState(null, '', updatedLocation.href);
        }
    }
}
```

---
---
---

## Overview
### Routes
The `<path-router>` element is a custom element that allows you to show a single `<route-page>` element at a time, based on matching the `path` attributes. Here is a simple example:
```html
<path-router path="home">
    <route-page path="home">Home</route-page>
    <route-page path="about">About</route-page>
    <route-page path="contact">Content</route-page>
</path-router>
```
In this example, the `<route-page>` with the `path` attribute set as "home" will be visible. All other `<route-page>` children will be hidden using CSS.  
If the `<path-router>` element's `path` attribute was set to "about", the `<route-page>` with the `path` attribute set as "about" would be visible, instead.

"Path Routers" are a common method of displaying only relevant parts of an app or website. By representing "where" a user is in your app or website using a "path", a wide variety of views can be supported with relatively simple configuration.

As demonstrated in the example above, it is trivial to show or hide content; the only requirement is to match the router's path to the route's path.

### Navigation
When the `<path-router>` element needs to display a different `<route-page>`, this can be achieved by "navigating" to a different path. Navigating is done by setting the `<path-router>` element's `path` attribute.

While updating the path is as simple as changing the attribute, a "navigation" is a full process that includes closing the currently open route - if one is currently open - and then opening the `<route-page>` element that matches the requested path. The entire process includes any css transitions set for the opening/closing routes, along with multiple events which can asynchronously block the process. 

The `<path-router>` element includes a `navigate` function which accepts a `path` string as its parameter. However, it is *not* required to use the `navigate` function; navigation will occur any time the `path` attribute is changed.  
Unlike changing the attribute directly, though, the `navigate` function is asynchronous and returns an awaitable Promise. This allow functionality to await the full navigation and transitions before occurring.

### Default Route
If the `path` attribute is not provided, the path router will not attempt to route. This allows initialization functionality to be applied before loading the initial route.  
If the `path` attribute is set to a string that cannot be matched to any `<route-page>` element's `path` attribute (see matching), the "Default" route will be loaded.

The "Default" route is determine by the following cascade:
- The last `<route-page>` element that has the `default` attribute will be set as the "Default" route. It is *expected* that there is only one default route, but multiples will just use the last `<route-page>` element.
- If no `<route-page>` element has the `default` attribute, the first `<route-page>` child in the `<path-router>` element will be used as the default route.

### Subrouting
In many cases, routing can benefit from "subroutes" which is just a label to describe nesting a `<route-page>` element inside of another `<route-page>` element and using a single path to update both routes. To help clarify, see this example:
```html
<path-router path="home">
    <route-page path="home">Home</route-page>
    <route-page path="about">About</route-page>
    <route-page path="about/app">About - This App</route-page>
    <route-page path="about/company">About - Company</route-page>
    <route-page path="about/mission">About - Mission</route-page>
    <route-page path="about/faq">About - FAQ</route-page>
    <route-page path="contact">Content</route-page>
</path-router>
```
In this example, there are many routes that have the same prefix - "about". While this example will work just fine, it can often be inefficient to repeat content across several `<route-page>` elements. For example, if each of the "about" routes used a complex header, instead of just the word "About", all of that content would need to be duplicated for each route.

To simplify, the above example can be rewritten like this:
```html
<path-router path="about/mission">
    <route-page path="home">Home</route-page>
    <route-page path="about">
        About - 
        <div class="route-view">
            <route-page path="app">This App</route-page>
            <route-page path="company">Company</route-page>
            <route-page path="mission">Mission</route-page>
            <route-page path="faq">FAQ</route-page>
        </div>
    </route-page>
    <route-page path="contact">Content</route-page>
</path-router>
```
In this updated example, you can see that all of the routes whose `path` attributes were prefixed with "about" have now been moved into a nested `<route-page>` element, and had their "about" prefixes removed.  
From the `<path-router>` element, the path is set to go to the top level route of "about" and then to the "subroute" of "mission". This causes the top `<path-router>` element to open the `<route-page>` with the "about" `path` attribute, and the nested `<route-page>` element with the "mission" `path` attribute.

### Route Properties
Route Properties are a way to allow multiple path strings to match the same path.

Route Properties are defined by using a slug prefixed with the `:` character:
```html
<route-page path="user/:id"></route-page>
```
In this example, a route property named "id" is defined. Any url-safe string can be used as a route property name, including strings with hyphens.

### `router.getProperties()`
Any property that is defined by a `<route-page>` will be accessible in javascript by using the provided `getProperties` function. This function returns an object of key/value pairs that uses the defined property as a key, and the requested value from the `<path-router>` element's `path` attribute, as the value. For example:
```html
<path-router path="/user/21/contact/gw2ozjh">
    <route-page path="home">Home</route-page>
    <route-page path="user/:userId">
        User
        <div class="route-view">
            <route-page path="profile">Profile</route-page>
            <route-page path="contact/:contactId">Contact</route-page>
        </div>
    </route-page>
</path-router>
```
In this example, the `getProperties` function will return an object with a property named `userId` set to `21`, and a property name `contactId` set to `gw2ozjh`.

In addition to getting all path properties from the `<path-router>` element, specific `<route-page>` element properties can be collected by calling the `getProperties` function on the target `<route-page>` element.

## Route links
In order to navigate the `<path-router>` element using link and button elements, the `<path-router>` element provides the `addRouteLinkClickHandlers` helper function. Calling this function with no parameter will assign a listener to the `document` object. To scope the listener to a target `element`, pass that element in as a parameter to the function.

Once that function has been called, any clicks on the listener target will be handled by a function that looks for a `data-route` attribute and uses that attribute's value to navigate the `<path-router>` element.

### `data-route` attribute
The `data-route` attribute is only relevant on anchor (`<a>`) elements and `<button>` elements. If either of those elements have that attribute, and are within the listener target, the value of their `data-route` attribute will be set as the path for the `<path-router>` element that the `addRouteLinkClickHandlers` helper function was called on.
```html
<a data-route=""></a>
<button data-route=""></button>
```

### Route Properties
If a route property is represented in a `data-route` attribute, and a route property with that exact name is represented by the route's parent `<path-router>` or `<route-page>` element, then the value of that route property will be substituted for the property name.

This allows a link with a path of `user/:userId/contact` to always route to the `contact` page relevant to whatever value is currently being used for `:userId`. For instance, if the `<path-router>`'s path was set to `user/bob` and a route link's `data-route` property was set to `user/:userId/contact`, then clicking the link would route the `<path-router>` to `user/bob/contact`.

## Dialog Routes
In addition to the `<route-page>` elements, the `<path-router>` element supports a secondary layer or routing that allows for `<dialog>` elements to be used as special-case routes within the router.

This "second layer" has some unique qualities which are based on common use-cases for dialogs that are also application routes. The most obvious difference is that routing to a dialog will *not* navigate away from the currently open `<route-page>` element. This means that opening a dialog does not dispatch any of the current `<route-page>` element's "close" events, and the curent page stays visible, behind the open dialog.  
This functionality is due to the common use-case of having a dialog open above the current content, rather than replacing current content.

Not all `<dialog>` elements should be routes. A user notification, or a status message may not need to be involved with routing, at all.  
Some `<dialog>` elements, though, do have some expectations of routing, while still maintaining all of the expectations for dialogs. An example of this would be an "App Configuration" dialog. These options may need to be available anywhere else within your app. And you may want to be able to return users directly to this current path, with the configuration open to where they had last left it.  
Given both of these expectations, a standard `<route-page>` element would introduce clunky management, while a standard `<dialog>` element would have to be handled separately, with bespoke functionality, in order to achieve the result.

To make this easier, a `route-dialog` element can be used. Since a `route-dialog` element is an extension of a standard `<dialog>` element, it must be invoked using the `is` parameter, rather than by using the custom element name as its tag.
```html
<dialog is="route-dialog" path="config">Config</dialog>
```

Routing to a `route-dialog` element uses the same `path` attribute for the `<path-router>` element, but is separated from the `<route-page>` path by a "hash" character (`#`).  
Subrouting and route properties all work the same as with `<route-page>` paths. All text before the "hash" character is used as the `<route-page>` path, and all text after the "hash" character is used as the `route-dialog` path. 
```html
<a data-route="#config">Config</a>
<path-router path="home#config">
    <route-page path="home">Home</route-page>
    <route-page path="user/:userId">User</route-page>
    <dialog is="route-dialog" path="config">Config</dialog>
</path-router>
```
In this example, the "Home" `<route-page>` would be opened with the "Config" `route-dialog` opened on top of it.

## Transitions
During navigation, the `<route-page>` and `route-dialog` elements dispatch the following events:
- `beforeopen`
- `afteropen`
- `beforeclose`
- `afterclose`

Each of these events can be handled with by using the `addEventListener` function, or by using the `addBlockingEventListener` function. For example:
```js
document.querySelector('route-page[path="home"]').addEventListener('beforeopen', (customEvent) =>
{
    console.log('This will log before the "home" route is opened');
});
document.querySelector('route-page[path="user"]').addEventListener('afteropen', (customEvent) =>
{
    console.log(`This will log after the "user" route's css transition has finished.`);
});
document.querySelector('route-page[path="home"]').addBlockingEventListener('beforeclose', async (customEvent) =>
{
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('This will prevent the "home" route from closing for 1 second, whiel the above promise is awaited.');
});
```
### Attributes
To indicate specific stages of each transition, data attributes are added to, and removed from, the `<route-page>` and `route-dialog` elements during transitions.

Before a route is opened, it will be assigned the `data-entering` attribute. This attribute is removed when the route has been assigned the `open` attribute.  
Before a route is closed, it will be assigned the `date-exiting` atttribute. This attribute is removed after the route has had it's `open` attribute removed.

### Animations
By default, the routes are styled to allow for any type of CSS `transition` or `animation` effect to be awaitable by the transition. This means that if you have an `afteropen` event, and that route has a 2 second animation, the entire animation will play before the `afteropen` event is dispatched. This kind of functionality is useful for triggering events on the newly opened route - like when to start its children's animations.

## Styling
These custom elements do not use a shadow DOM, so they can be styled like any other element. Some default styles have been applied to account for transitions, but these styles can be overridden as ususal with CSS.

### Grid Display
In order to facilitate transitions, a grid display is used on the `<path-router>` element so that all of its children can be stacked in a single row and column. Unlike a `position` value of `absolute`, this allows the children to set the `auto` size of the router and expands all children to the same width and height as the largest child.

This display allows transition effects to be based on a single route size and have the same behavior for operations like rotation and scaling.

### `visibility` instead of `display`
The common practice of having a visual element "fade in" or "fade out", from transparent to opaque and back, has legacy support issues with using the `display` property while trying to control the transparency. 

To circumvent these issues, `<route-page>` elements set the `visibility` property rather than the `display` property when a route has been opened or closed. While this does not have much affect on other animations, any animations that expect the element's opacity to animate will be able to do so without issues around visual pop-in or premature event dispatches for `after` events.

### `route-view` class
The grid-style display of the `<path-router>` element is useful for stacking the child `<route-page>` elements so that they all take up the same area, rather than each taking up their own space. This "card stack" style of rendering is also assigned to the `route-view` css class as convenience for getting the same effect in subroutes as in top-level routes.

Any element that has the class of `route-view` will behave like a `<path-router>` element in its layout by stacking all of its child `<route-page>` elements on top of each other so that they take up the same area.

## Browser History and URL updates
The `<path-router>` element **DOES NOT** make changes to the browser's URL in any way. It does not access the `window`'s `location` property, and does not interface with the browser's `History` API. While it is common practice for front-end routers to modify a user's URL, this library does not include that functionality.

The `<path-router>` element does include helper functions to facilitate modifying the browser's URL and History, but those functions must be invoked by the implementing developer, and the results of them must be parsed and applied to the browsers URL/History manually. 

In most cases, updating the browser history or url can be done by handling the `pathcompose` event and comparing the current url to the target url, like in this example:
```js
pageRouter.addEventListener('pathchange', pageRouter_onPathChange);
function pageRouter_onPathChange(event)
{
    // if we're moving back or forward,
    // we don't want to record that in history
    // and the browser will update the url
    if(historyIsUpdating == true) { return; } 
    
    const currentLocation = window.location;
    let updatedPath = pageRouter.getAttribute('path');
    const origin = window.location.origin;
    const updatedLocation = new URL(`${origin}/${updatedPath}`);

    const { hasChanged, isReplacementChange } = pageRouter.compareLocations(currentLocation, updatedLocation);
    if(hasChanged)
    {
        if(isReplacementChange)
        {
            window.history.replaceState(null, '', updatedLocation.href);
        }
        else
        {
            window.history.pushState(null, '', updatedLocation.href);
        }
    }
}
```
In this example, we listen for the `pathchange` event and then use the `compareLocations()` feature to determine the details of how our navigation state has been changed.  
Once the navigation events are understood, the browser's history is updated by either replacing the current state, if we want to preserve the back function as an close command for a dialog, or by adding a new history entry if we want the back function to navigate us back to our previous route.


### Dialog Routing History
In many cases, it is expected that while a dialog may be routed to, any "back" or "previous" navigations called (usually by the browser's back button, or a mobile device's back button) should close the dialog rather than strictly route backward through the app router's history.  

This may seem counterintuitive - and you may not want this functionality for your app! - but it's a common pattern. To help contextualize it, you can think of an app that has a "config" dialog and a "user account" dialog, each which can be opened from anywhere in the application. If a user navigates from the "config" dialog to the "user account" dialog and then refreshes the page, they could expect to be returned to the "user account" page. But if they want to "close" that dialog by using the "back" button on their mobile OS, that action wouldn't work. Instead, they would be routed back to the "config" dialog, which may be confusing. 

As seen in the example above, this unexpected behavior can be avoided by replacing the history state, rather than adding an entry to it, whenever navigating from one dialog route to another.


### History and URL Notes
This "facilitation without implementation" is due to the complex nature of app navigation state and this library's adherence to the principle that the developer building the app would know *best* how to handle this state, and that a library should not try to do operations that it is not *best* suited to handle.

In a router, this is complicated because, while the app developer knows *best* about navigation state, the router knows *best* how a navigation occurred. This forces the implementing dev to first make the navigation occur, and then get a report about what occurred during that navigation, so they can use that report to set the appropriate state based on what happened.

More simply, the implementing dev should only have to provide a path. So it's a complicated task to take in a path and then provide the specific information that a dev would need to determine what the actual navigation outcome of providing that path is. In simple cases, this is trivial, but when you add in the "second layer" of dialog routes, subrouting, and the complications of route properties in a path, there are more things for an implementing dev to manage than just where the app's navigation state was and where it is now.

This library has tried to whittle things down to two key pieces of info: a single, compiled version of the path that represents a combination of all routers' and subrouters' paths, and whether or not the navigation occurred from one dialog route into another dialog route.

With these two pieces of information, history can be tracked in a robust way that allows for the common use-cases of closing a dialog when a "back" action is taken (either with the browser button or a mobile OS's button).

The advantages of this strategy allow impementing devs to give their users the option of whether or not to allow the app to set the browser's history, and it prevents devs from having to turn off functionality that they aren't interested in. 

## License
This library is in the public domain. You do not need permission, nor do you need to provide attribution, in order to use, modify, reproduce, publish, or sell it or any works using it or derived from it.
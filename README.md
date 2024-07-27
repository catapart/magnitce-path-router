# `<path-router>`
A custom `HTMLElement` that routes to pages based on its `path` attribute.

Includes subrouting, transitions, events, dialog routes, route links, and route buttons.

Package size: ~12kb minified, ~22kb verbose.

## Quick Reference
```html
<menu>
    <a is="route-link" for="app-router" path="/">Home</a>
    <a is="route-link" for="app-router" path="/user">User</a>
    <a is="route-link" for="app-router" path="/help/faq">FAQ</a>
    <a is="route-link" for="app-router" path="/help/contact">Contact</a>
</menu>
<path-router id="app-router">
    <path-route path="/">
        <header>Home</header>
        <p>Home Content</p>
    </path-route>
    <path-route path="/user/:id">
        <header>User</header>
        <p>User Content</p>
    </path-route>
    <path-route path="/help/:subpage">
        <header>Help</header>
        <menu>
            <nav>
                <ul>
                    <li><a is="route-link" for="help-router" path="/faq">FAQ</a></li>
                    <li><a is="route-link" for="help-router" path="/contact">Contact</a></li>
                </ul>
            </nav>
        </menu>
        <path-router id="help-router">
            <path-route path="/faq">
                <header>Frequently Asked Questions</header>
                <p>Answer Content</p>
            </path-route>
            <path-route path="/contact">
                <header>Contact Us</header>
                <p>Contact Content</p>
            </path-route>
            <dialog is="route-dialog" path="about">
                <header>About</header>
                <p>About Content</p>
                <form method="dialog"><button method="dialog">Close</button></form>
            </dialog>
        </path-router>
        <div><button type="button" is="route-button" for="help-router" path="#about">About App</button></div>
    </path-route>
</path-router>
<script type="module" src="/path/to/path-router[.min].js"></script>
```

## Demo
https://catapart.github.io/magnitce-path-router/demo/

To run the demo, yourself, run the `package` script (`npm run pacakge`) before serving the demo index page.

## Support
- Firefox
- Chrome
- Edge
- <s>Safari</s> (Has not been tested; should be supported, based on custom element support)

## Getting Started
 1. [Install/Reference the library](#referenceinstall)
 
 <!-- 1. [Styling](#styling) -->

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


## License
This library is in the public domain. You do not need permission, nor do you need to provide attribution, in order to use, modify, reproduce, publish, or sell it or any works using it or derived from it.
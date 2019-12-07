# Browser suite for code editing

The project has two specificities why you might love it

## 1/ Only standard storage backend is require (e.g. WebDAV)

You don't need to run yet-anothet service on your server. If you have standard
WebDAV server running, you are ready to go.

## 2/ It comes in form of web components

You can simply put them into your project just by

```
<script src="https:///path/to/deisred/component.js" type="module"/>
...
<your-component [some-custom-settings]>
```

## 3/ Communicates via customEvents on `document`

Therefor you can simply exchange any component for your own and if you listen/fire
the same customEvents then everything will still work.


## Editor

Editor enables you to edit files that are provided by another element in the page.

Communication to/from the editor is done via customEvents.
 * __"file:open"__ instruct editor toopen a file. Detail dictionary must contain
  "filename", "content"
 * __"file:save"__ is fired by the editor any time someone hits save button. The detail
   dictionary contains "filename" and "content".

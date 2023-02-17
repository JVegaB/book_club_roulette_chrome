
### Objective and technical reach of the app

This app was build in order to export some data from docs.google.com/spreadsheets (more specific, books informatino).

It can only read the current page, since it depends on the docs.google.com/spreadsheets own mechanism to download a spread sheet,
which is to concatenate to the url "export?format=csv".

Once we download the information from the page (ussing the official "fetch" API). We use the third party library "Papa Parse" (https://www.papaparse.com/), in order to take that raw string, and parse it into a CSV format (that is actually an array of literal objects in JS).

After we have that processed CSV data. We use another third party library "Winwheel by zarocknz" (https://github.com/zarocknz/javascript-winwheel), to display it in a roulette (drawn in a canvas element), and make it spin. This with the finality to choose a random item, with some fancy animations. (Wheels can be animated using GreenSock's Animation Platform (TweenMax.js) which contain easing functions and many other powerful animation features. So we needed to add that library to.)

The UI for the mentioned above, was build using two other libraries:

- For the CSS, we just used TailWind CSS (https://cdn.tailwindcss.com/)
- For the Render engin, we use hyperHTML (https://github.com/WebReflection/hyperHTML)

This application, has no dependencies. And it can be build and mounted, having only the source code on this folder.

### How to run/test the app

Preparing the spread sheet:

1. Enter to a Google spread sheet where you have reading permisions.
2. Add these required headers (Be aware of using the caps and spaces im using): "Nombre", "Autor", "Propuesto por", "Estatus".
3. Add some lines down those headers, add some books you know.
4. Take special atention to the "Estatus", since we use this value to filter the results later on.

Staring the app:

1. Open the page action that is shown in the address bar of your browser.
2. Wait untill the loading message disappears.
3. In the drop down menu / select input, is shown, select some term, to filter the data that is in your spread sheet. Then click the button bellow that.
4. Now you are in the preview screen, click the button bellow the list of books (now filtered), again to be sent to the next screen. (In this preview screen, you can also delete books from the app [it will not affect the actual spread sheet]).
5. In the roulette screen, you can add a number of attems (if more than 1, the roulete process will be repeated, discarting the chosen book). Click the button bellow to start the roulette.
6. After the roulette finishs (it takes between 15-30 seconds randomly). It will take you to the results screen.
7. If you entered more than 1 attemps, it will let you start again.

### Notes

The app is in Spanish, since it will be used only in that language.

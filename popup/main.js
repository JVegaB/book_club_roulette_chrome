/**
 * Main renderer function, used to display content into the <section id="root"/> element,
 * in * order to be treated as a single page application.
 * See popup/index.html.
 */
const Render = hyperHTML.bind(document.querySelector('section#root'));

/**
 * Fisher–Yates shuffle algorithm.
 * See more at https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
 * @param {Array<Any>} array Array to be mutated
 */
const shuffleArray = array => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
}

/**
 * Starting point of the application, thus requiring IIFE.
 *
 * Shows the validation of the site, to check if the app can be correctly run, to avoid ugly
 * tracebacks to the final user.
 *
 * If this initial flow "fails", the application is stopped.
 */
(async function LoadBookData () {
    let _CSVData = null;
    let _filterTerm = "";
    /**
     * Validation of the url to check if the website is compatible with this app.
    */
    let [{ url }]  = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!url.includes('docs.google.com/spreadsheets')) {
        Render`
            <div class="grid place-items-center bg-white py-24 px-6">
                <p class="text-base font-semibold text-red-600">Página no soportada :(</p>
                <p class="mt-6 text-base leading-7 text-gray-600">Abre esta app en
                <a href="https://docs.google.com/spreadsheets">Google Spreadsheets</a>
                </p>
            </div>
        `;
        return;
    }
    try {
        if ( url.includes('/edit') ) url = url.substring(0, url.indexOf('/edit'));
        /**
         * Validates the download.
         */
        const res = await fetch(`${url}/export?format=csv`);
        if ( res.status !== 200 )
            throw `Problema al descargar datos de la página: ${res.statusText}`;
        /**
         * Parsing
         */
        const csvText = await res.text();
        const parsedCSV = Papa.parse(csvText, {
            header: true,
            dynamicTyping: true
        });
        if (parsedCSV.errors.length) {
            console.error(JSON.stringify(parsedCSV.errors));
            throw `Problema al convertir datos descargados`;
        }
        _CSVData = parsedCSV.data;

    } catch (error) {
        console.error(error)
        Render`
        <div class="grid place-items-center bg-white py-24 px-6">
            <p class="text-base font-semibold text-red-600">Error</p>
            <p class="mt-6 text-base leading-7 text-gray-600">${JSON.stringify(error)}</p>
        </div>
        `;
        return;
    }
    
    const booksStatus = Array.from(_CSVData.reduce((all, current) => all.add(current.Estatus), new Set())).filter(e => e);
    Render`
        <form action="#" method="POST" class="m-0">
            <div class="overflow-hidden shadow">
                <div class="space-y-6 bg-white px-4 py-5 sm:p-6">
                    <fieldset>
                    <legend class="contents text-base font-medium text-gray-900">Resultados</legend>
                    <p class="text-sm text-gray-500">Hemos encontramos: ${_CSVData.length} libros.</p>
                    <div class="mt-4">
                        <div class="col-span-6 sm:col-span-3">
                            <label for="status" class="block text-sm font-medium text-gray-700">Filtrar por estatus de lectura:</label>
                            <select onchange="${(event) => {
                                _filterTerm = event.target.value;
                            }}" id="status" name="status" class="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm">
                            <option value="">Todos</option>
                            ${booksStatus.map(status =>
                                `<option>${status}</option>`
                            )}
                            </select>
                        </div>
                    </div>
                    </fieldset>
                </div>
                <div class="bg-gray-50 px-4 py-3 text-right">
                    <button onclick="${() => PreviewCSVData(_filterTerm ? _CSVData.filter(book => book.Estatus == _filterTerm) : _CSVData)}" type="button" class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                        Previsualizar
                    </button>
                </div>
            </div>
        </form>
    `;
})();

/**
 * Renderer function to preview the data previously downloaded. Some items can be cleared from here (CTA in the UI).
 * @param {*} books 
 */
function PreviewCSVData (books) {
    Render`
    <form action="#" method="POST" class="m-0">
        <div class="overflow-hidden shadow">
            <div class="space-y-6 bg-white px-4 py-5 sm:p-6">
                <fieldset>
                    <legend class="contents text-base font-medium text-gray-900">Limpiar resultados</legend>
                    <ul id="book-list-preview" class="divide-gray-200 dark:divide-gray-700 mt-8 mb-4 px-3 mx-3">
                        ${books.map(book =>
                            hyperHTML.wire(book)`<li class="pb-3 sm:pb-4">
                                <div class="flex items-center space-x-4">
                                    <div class="flex-1 min-w-0">
                                        <p class="text-sm font-medium text-gray-900 truncate dark:text-white">
                                            ${book.Nombre}
                                        </p>
                                        <p class="text-sm text-gray-500 truncate dark:text-gray-400">
                                            ${book.Autor}
                                        </p>
                                    </div>
                                    <button type="button" onclick="${() => PreviewCSVData(books.filter(_book => _book !== book))}" class="text-red-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>
                                    </button>
                                </div>
                            </li>`
                        )}
                    </ul>
                </fieldset>
            </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 text-right">
            <button onclick="${() => OpenRoulette(books, 1)}" type="button" class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                Elegir al azar
            </button>
        </div>
    </form>
    `
}

/**
 * Renderer function to show the Roulette.
 *
 * @param {Array<Object>} books The actual collection to be shown.
 * @param {Integer} attemps The number of times the flow is wanted to be repeated.
 */
function OpenRoulette (books, attemps=1) {
    shuffleArray(books);
    const COLORS = ['#13005A','#00337C','#1C82AD','#03C988','#00425A','#1F8A70','#BFDB38','#FC7300','#3D1766','#6F1AB6','#CD0404','#CB1C8D','#7F167F','#460C68','#E14D2A','#FD841F','#3E6D9C','#001253','#9A1663','#E0144C','#FF5858','#FF97C1','#000000','#150050','#3F0071','#FB2576'];
    const RouletteITem = caption => {
        const color = COLORS[Math.floor(Math.random()*COLORS.length)];
        return {
            fillStyle: color,
            textFillStyle: 'white',
            text: (caption || '').substring(0, 25),
        };
    }
    let rouletteProxy;

    Render`<form action="#" method="POST" class="m-0">
        <div class="overflow-hidden shadow">
            <div class="space-y-6 bg-white px-4 py-5 sm:p-6">
                <fieldset>
                    <main>
                        <section class="grid place-items-center py-6">
                            <canvas id="canvas" width="434" height="434"></canvas>
                        </section>
                    </main>
                </fieldset>
            </div>
        </div>
        <footer class="bg-gray-50 px-4 py-3 flex justify-between items-center">
            <div class="text-left">
                <label for="first-name" class=" block text-sm font-medium text-gray-700"># de Intentos</label>
                <input onchange=${(ev) =>
                    ev.currentTarget.value = attemps = Math.min(~~ev.currentTarget.value, books.length)
                } type="number" min="1" max="${books.length}" name="first-name" value="${attemps}" id="first-name" class="mt-1 max-w-[75%] text-center rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
            </div>
            <div class="">
                <button onclick=${(ev) => {
                    ev.currentTarget.disabled = 'disabled';
                    rouletteProxy.startAnimation();
                }} type="button" class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    Dale caña tío!
                </button>
            </div>
        </footer>
    </form>`;

    rouletteProxy = new Winwheel({
        'outerRadius': 210,
        'textFontSize': 12,
        'textAlignment': 'outer',
        'numSegments': books.length,
        'segments': books.map(book => RouletteITem(book.Nombre)),
        'animation': {
            'type': 'spinToStop',
            'duration': 10 + (Math.floor(Math.random() * 15)),
            'spins': 15 + (Math.floor(Math.random() * 20)),
            'callbackFinished': (selection) => {
                const selected = books.find(book => book.Nombre && book.Nombre.startsWith(selection.text));
                if (selected) {
                    ShowWinner(selected, books, attemps - 1)
                } else {
                    alert('Please try again')
                }
            }
        }
    });;
}

/**
 * Renderer function to show a book being choosed randomly.
 *
 * @param {Object} book Current book to display as a selection/winner.
 * @param {Array<Object>} booksCollection The books where the winner book was chosen. Needed to clean the collection from the actual
 * winner, and repeat the flow.
 * @param {Integer} attemptsRemaining Is the number of attemps remaining to repeat the roulette workflow. It is what make the whole
 * thing repeat.
 */
function ShowWinner (book, booksCollection, attemptsRemaining) {
    booksCollection = booksCollection.filter(_book => _book !== book);
    Render`<div class="overflow-hidden bg-white shadow sm:rounded-lg">
    <div class="px-4 pr-16 py-5 sm:px-6">
        <h3 class="text-lg font-medium leading-6 text-gray-900">
            ${attemptsRemaining > 0
                ? hyperHTML.wire()`
                Libro descartado
                <span>
                    <svg style="display: inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                    </svg>
                </span>`
                : hyperHTML.wire()`
                Libro ganador
                <span class="text-yellow-300">
                    <svg style="display: inline" xmlns="http://www.w3.org/2000/svg" fill="yellow" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                    </svg>                  
                </span>`
            }
        </h3>
        <p class="mt-1 max-w-2xl text-sm text-gray-500">
        ${attemptsRemaining > 0 ? `Intentos restantes ${attemptsRemaining}` : 'Desglosado de información'}
        
        </p>
    </div>
    <div class="border-t border-gray-200">
        <dl>
            <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Nombre</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">${book.Nombre}</dd>
            </div>
            <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Autor</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">${book.Autor}</dd>
            </div>
            <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Propuesto por</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">${book['Propuesto por']}</dd>
            </div>
        </dl>
    </div>    
    ${attemptsRemaining > 0
        ? hyperHTML.wire()`
        <div class="bg-gray-50 px-4 py-3 text-right">
            <button onclick="${() => OpenRoulette(booksCollection, attemptsRemaining)}" type="button" class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                Siguiente intento
            </button>
        </div>`
        : ''
    }
</div>`;
}
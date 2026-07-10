const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');
const jsApp = fs.readFileSync('js/app.js', 'utf8');
const jsIngredientes = fs.readFileSync('js/ingredientes.js', 'utf8');
const jsRecetas = fs.readFileSync('js/recetas.js', 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously" });

// Mock prompt and alert
dom.window.prompt = () => "2000";
dom.window.alert = console.log;

// Inject scripts manually because JSDOM might not load src scripts correctly in this setup
const script1 = dom.window.document.createElement("script");
script1.textContent = jsApp;
dom.window.document.body.appendChild(script1);

const script2 = dom.window.document.createElement("script");
script2.textContent = jsIngredientes;
dom.window.document.body.appendChild(script2);

const script3 = dom.window.document.createElement("script");
script3.textContent = jsRecetas;
dom.window.document.body.appendChild(script3);

// Wait a tiny bit for DOMContentLoaded
setTimeout(() => {
    try {
        console.log("Ingredientes before:", dom.window.sweetcostIngredientes.length);
        
        // Emulate filling Carga Rapida
        const form = dom.window.document.getElementById("form-carga-rapida");
        const btnTabIngredientes = dom.window.document.getElementById("btn-tab-ingredientes");
        
        // Switch to ingredients tab
        btnTabIngredientes.click();
        
        const inputNombre = dom.window.document.getElementById("input-nombre-rapido");
        const inputPrecio = dom.window.document.getElementById("input-precio-rapido");
        inputNombre.value = "Test Harina";
        inputPrecio.value = "100";
        
        // Submit the form
        const submitEvent = new dom.window.Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
        
        console.log("Ingredientes after:", dom.window.sweetcostIngredientes.length);
        
        const tbody = dom.window.document.getElementById("tabla-ingredientes-body");
        console.log("Table row count:", tbody.children.length);
        console.log("Table HTML:", tbody.innerHTML.trim().substring(0, 100));
        
    } catch (e) {
        console.error("Error during test:", e);
    }
}, 100);

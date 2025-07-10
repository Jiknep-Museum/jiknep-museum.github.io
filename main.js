let alignTimer;

// Redimenssione les images à la taille de la fenêtre
function imgResize(elt){
    let naturalRatio = elt.naturalWidth / elt.naturalHeight;
    // try to scale verticaly first (70% of screen)
    let height = window.innerHeight * 0.70;
    let width = height * naturalRatio;

    if (width > window.innerWidth * 0.90){
        width = window.innerWidth * 0.90;
        height = width / naturalRatio; 
    }
    elt.style.height = (height|0) + "px" ;
    elt.style.width = (width|0) + "px" ;
}
function battlepassResize(){
    let img = document.getElementById("battlepass-img");
    let rX = img.clientWidth / img.naturalWidth;
    let rY = img.clientHeight / img.naturalHeight;
    let coordsAccept =[60*rX, 420*rY, 510*rX, 490*rY].join(",");
    document.getElementById("battlepass-accept").coords = coordsAccept;
    let coordRefuse = [1225*rX, 10*rY, 1265*rX, 50*rY].join(",");
    document.getElementById("battlepass-refuse").coords = coordRefuse;
}

// Scoll pour aligner sur le haut de la fenêtre le Jiknep le plus proche
let previousPageYOffset = pageYOffset;
function alignScroll() {
    let scrollY = pageYOffset - previousPageYOffset

    //désactiver si on a atteind le fond
    if (pageYOffset + window.innerHeight + 10 > document.body.scrollHeight) {
        return
    }

    for (jqnp of document.querySelectorAll(".jqnp")){
        //vers le bas : on ajuste sur le premier tableau dont le sommet du cadre est dans le viewport
        if (scrollY > 0 && jqnp.offsetTop > pageYOffset) {
            scrollTo({top: jqnp.offsetTop - 10, behavior:"smooth"});
            previousPageYOffset = jqnp.offsetTop - 10;
            break;
        }
        //vers le haut : on ajuste sur le premier tableau dont le bas du cadre est dans le viewport
        if (scrollY < 0 && jqnp.offsetTop + jqnp.offsetHeight > pageYOffset) {
            scrollTo({top: jqnp.offsetTop - 10, behavior:"smooth"});
            previousPageYOffset = jqnp.offsetTop - 10;
            break;
        }
    }
}

// Ajoute un Jiknep à la page
function add_jqnep(jqnp, mur){
    // panneau général
    let jqnpElt = document.createElement("div");
    jqnpElt.className = "jqnp";
    mur.append(jqnpElt)

    // tableau
    let tableauElt = document.createElement("div");
    tableauElt.classList.add("tableau");
    jqnpElt.append(tableauElt);
    
    // image
    let imgElt = document.createElement("img");
    imgElt.src = jqnp.image_url;
    imgElt.onload = elt=>imgResize(elt.target);
    tableauElt.append(imgElt);

    // auteur
    let auteurElt = document.createElement("div");
    auteurElt.classList.add("auteur");
    auteurElt.classList.add("halo");
    let nbSignature = Array.from(jqnp.auteur)
        .map(s=>s.charCodeAt(0))
        .reduce((a,v)=>a+=v, 0) 
        % 9 + 1;
    auteurElt.style.fontFamily = "sign" + nbSignature;
    auteurElt.textContent = jqnp.auteur;
    auteurElt.title = jqnp.auteur;
    tableauElt.append(auteurElt);

    // plaque
    let plaqueElt = document.createElement("div");
    plaqueElt.className = "plaque";
    jqnpElt.append(plaqueElt);

    // nom
    let nomElt = document.createElement("div");
    if (jqnp.reponse[0]) {
        nomElt.className = "nom";
        nomElt.append(document.createTextNode(jqnp.reponse[0]));
    }
    else {
        nomElt.className = "nom-indetermine";
        nomElt.append(document.createTextNode("Nom de l'oeuvre en cours de délibération"));
    }
    plaqueElt.append(nomElt);

    // reactions
    let reactionsElt = document.createElement("div");
    reactionsElt.className = "reactions";
    let buildReacticon = (text,reacts) => {
        let reactPart = document.createElement("div");
        if (reacts.length > 0){
            reactPart.append(document.createTextNode(text))
            for (react of reacts) {
                let reactElt = document.createElement("span");
                reactElt.className = "react";
                let reactStr = document.createElement("span");
                reactStr.className = "react_str";
                reactStr.append(document.createTextNode(react[0]))
                let reactCount = document.createElement("span");
                reactCount.className = "react_count";
                reactCount.append(document.createTextNode(react[1]))
                reactElt.append(reactStr);
                reactElt.append(document.createTextNode(" "));
                reactElt.append(reactCount)
                reactPart.append(reactElt);
            }
        }
        return reactPart;
    }
    reactionsElt.append(buildReacticon("réactions à l'image: ", jqnp.reactions_image));
    reactionsElt.append(buildReacticon("réactions au nom: ", jqnp.reactions_reponse));
    plaqueElt.append(reactionsElt);
}

function togglePanel(eltId){
    let panel = document.getElementById(eltId);
    if (panel.style.display === "none" || panel.style.display === "") {
        panel.style.display = "block";
        panel.focus();
    } else {
        panel.style.display = "none";
    }
}

let allJikneps;
let lastLoadedJikneps;
function fillMuseum(){
    allJikneps = jqnps.map(jqnp => {
        jqnp.random = Math.random();
        jqnp.reactions_count = jqnp.reactions_image.reduce((acc,r)=>acc+=r[1], 0) 
                               + jqnp.reactions_reponse.reduce((acc,r)=>acc+=r[1], 0);
        return jqnp;
    });
    lastLoadedJikneps = 0;

    // filter par nom
    let nameValue = document.getElementById("search-name-value").value;
    let nameType = document.getElementById("search-name-type").value;
    if (nameValue) {
        if ( nameType == "contient") {
            allJikneps = allJikneps.filter(jqnp => jqnp.reponse[0].toLowerCase().trim().includes(nameValue.toLowerCase().trim()));
        }
        if ( nameType == "regex") {
            try {
                let regex = new RegExp(nameValue);
                allJikneps = allJikneps.filter(jqnp => regex.test(jqnp.reponse[0]));
            }
            catch{}
        }
        if ( nameType == "exact") {
            allJikneps = allJikneps.filter(jqnp => jqnp.reponse[0].toLowerCase().trim() == nameValue.toLowerCase().trim());
        }
    }
    // filter par auteur
    let authorValue = document.getElementById("search-author-value").value;
    if (authorValue) {
        allJikneps = allJikneps.filter(jqnp => jqnp.auteur.toLowerCase().trim().includes(authorValue.toLowerCase().trim()));
    }
    // filtrer par nombre de réactions
    let reactionsValue = document.getElementById("search-reactions-value").value;
    let reactionsType = document.getElementById("search-reactions-type").value;
    if (reactionsValue) {
        let reactions = parseInt(reactionsValue);
        if (reactionsType == "mini") {
            allJikneps = allJikneps.filter(jqnp => jqnp.reactions_count > reactions);
        }
        if (reactionsType == "max") {
            allJikneps = allJikneps.filter(jqnp => jqnp.reactions_count < reactions);
        }
        if (reactionsType == "exact") {
            allJikneps = allJikneps.filter(jqnp => jqnp.reactions_count == reactions);
        }
    }
    // filter par date
    let dateValue = document.getElementById("search-date-value").value;
    let dateType = document.getElementById("search-date-type").value;
    if (dateValue) {
        let date = new Date(dateValue);
        if (dateType == "avant") {
            allJikneps = allJikneps.filter(jqnp => new Date(jqnp.date) < date);
        }
        if (dateType == "après") {
            allJikneps = allJikneps.filter(jqnp => new Date(jqnp.date) > date);
        }
        if (dateType == "exact") {
            allJikneps = allJikneps.filter(jqnp => new Date(jqnp.date).toDateString() == date.toDateString());
        }
    }

    // tri
    let items = [
        ["date", j=>new Date(j.date).getTime()],
        ["reactions", j=>j.reactions_image.length + j.reactions_reponse.length],
        ["name", j=>j.reponse[0].toLowerCase()], 
        ["author", j=>j.auteur.toLowerCase()] 
    ];
    for (let [itemName, itemFunc] of items) {
        let sort = document.getElementById("sort-" + itemName).value;
        if (sort=="desc") {
            allJikneps.sort((a,b) => itemFunc(a) < itemFunc(b) ? 1 : -1);
        } 
        if (sort=="asc") {
            allJikneps.sort((a,b) => itemFunc(a) > itemFunc(b) ? 1 : -1);
        }
    }
    if (document.getElementById("random-mode").checked){
        allJikneps.sort((a,b) => a.random > b.random ? 1 : -1);
    }

    let count = document.getElementById("count");
    count.textContent = "Résultats : " + allJikneps.length;

    let museum = document.getElementById("museum");
    museum.innerHTML = "";

    lazyLoadJikneps();

}

const loadPack = 20;
function lazyLoadJikneps() {
    if (pageYOffset > document.body.scrollHeight - window.innerHeight -5) {
        let museum = document.getElementById("museum");
        for (let i=lastLoadedJikneps; i<allJikneps.length && i<lastLoadedJikneps+loadPack; i++) {
            add_jqnep(allJikneps[i], museum);
        }
        lastLoadedJikneps += loadPack;
    }
}

async function loadData(){
    const url = document.getElementById("zone").value;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }
    jqnps = await response.json();

    fillMuseum();
}

// ******************** Main code ********************
loadData();
window.onresize = evt => {
    for (img of document.querySelectorAll(".tableau img")) {
        imgResize(img);
    }
    battlepassResize();
}
let timer;
document.body.onscroll = evt => {
    lazyLoadJikneps();
    if (document.getElementById("auto-align").checked){
        clearTimeout(timer);
        timer = setTimeout(alignScroll, 100);
    }
}
document.addEventListener("DOMContentLoaded", (event) => {
    // changement d'aile 
    document.getElementById("zone").onchange = e => {
        togglePanel("zone-panel");
        loadData();
    }
    // ouverture/fermeture de la boite de recherche
    document.getElementById("options-toggle").onclick = e => togglePanel("options-panel");
    document.getElementById("zone-toggle").onclick  = e => togglePanel("zone-panel")
    // rafraichisement des tableaux en cas de changement des options de recherche
    document.querySelectorAll("#search-options input, #random-mode").forEach(elt => {
        if (elt.type == "checkbox") {
            elt.onclick = fillMuseum;
        }
        else {
            elt.onkeyup = fillMuseum;
        }
    });
    document.querySelectorAll("#search-options select").forEach(elt => {
        elt.onchange = fillMuseum;
    });
    // remplissage de la liste des auteurs
    let authorSelector = document.getElementById("search-author-value");
    authorSelector.append(document.createElement("option"));
    jqnps.map(jqnp=>jqnp.auteur)
        .reduce((acc, auteur) => {if (!acc.includes(auteur)) acc.push(auteur); return acc;}, [])
        .sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()))
        .forEach(auteur => {
            let option = document.createElement("option");
            option.value = auteur;
            option.textContent = auteur;
            authorSelector.append(option);
        });
    // initialisation des paramètres enregistrés
    let autoAlignElt = document.getElementById("auto-align");
    autoAlignElt.checked = localStorage.getItem("auto-align") === "true";
    autoAlignElt.onclick = e => { localStorage.setItem("auto-align", autoAlignElt.checked); alignScroll() }
    let randomModeElt = document.getElementById("random-mode");
    randomModeElt.checked = localStorage.getItem("random-mode") === "true";
    randomModeElt.onclick = e => { localStorage.setItem("random-mode", randomModeElt.checked); alignScroll() }
    // initalisation du battlepass
    setTimeout(()=>{
        if (localStorage.getItem("battlepass-displayed") !== "true"){
            localStorage.setItem("battlepass-displayed", true)
            document.getElementById("battlepass-panel").style.display="flex";
        }
    },10000)
    document.getElementById("battlepass-accept").onclick = e => alert("Mais ça va pas bien dans ta tête ?");
    document.getElementById("battlepass-refuse").onclick = e => document.getElementById("battlepass-panel").style.display="none";
    battlepassResize();
});

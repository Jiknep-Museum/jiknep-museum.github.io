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

// Scoll pour aligner sur le haut de la fenêtre le Jiknep le plus proche
function alignScroll() {
    for (jqnp of document.querySelectorAll(".jqnp")){
        if (jqnp.offsetTop + jqnp.offsetHeight/2 > pageYOffset) {
            scrollTo({top: jqnp.offsetTop - 10, behavior:"smooth"});
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
    nomElt.className = "nom";
    nomElt.append(document.createTextNode(jqnp.reponse[0]));
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

function searchToggleClick(){
    let optionsPanel = document.getElementById("options-panel");
    if (optionsPanel.style.display === "none" || optionsPanel.style.display === "") {
        optionsPanel.style.display = "block";
        optionsPanel.focus();
    } else {
        optionsPanel.style.display = "none";
    }
}

let allJikneps;
let lastLoadedJikneps;
function fillMuseum(){
    allJikneps = [...jqnps];
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
        let countReaction = jqnp => jqnp.reactions_image.reduce((acc,r)=>acc+=r[1], 0) + jqnp.reactions_reponse.reduce((acc,r)=>acc+=r[1], 0);
        if (reactionsType == "mini") {
            allJikneps = allJikneps.filter(jqnp => countReaction(jqnp) > reactions);
        }
        if (reactionsType == "max") {
            allJikneps = allJikneps.filter(jqnp => countReaction(jqnp) < reactions);
        }
        if (reactionsType == "exact") {
            allJikneps = allJikneps.filter(jqnp => countReaction(jqnp) == reactions);
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
        ["name", j=>j.reponse[0].toLowerCase()], 
        ["author", j=>j.auteur.toLowerCase()], 
        ["reactions", j=>j.reactions_image.length + j.reactions_reponse.length],
        ["date", j=>new Date(j.date).getTime()]
    ];
    for (let i=4; i>0; i--) {
        for (let [itemName, itemFunc] of items) {
            let sortOrder = document.getElementById("sort-order-" + itemName).value;
            if (sortOrder == i) {
                let sortDesc = document.getElementById("sort-direction-" + itemName).checked;
                if (sortDesc) {
                    allJikneps.sort((a,b) => itemFunc(a) < itemFunc(b) ? 1 : -1);
                } else {
                    allJikneps.sort((a,b) => itemFunc(a) > itemFunc(b) ? 1 : -1);
                }
            }
        }
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

// ******************** Main code ********************
fillMuseum();
window.onresize = evt => {
    for (img of document.querySelectorAll(".tableau img")) {
        imgResize(img);
    }
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
    // ouverture/fermeture de la boite de recherche
    document.getElementById("options-toggle").onclick = searchToggleClick
    // rafraichisement des tableaux en cas de changement des options de recherche
    document.querySelectorAll("#search-options input").forEach(elt => {
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
    // initialisation de l'alignement auto
    let autoFill = document.getElementById("auto-align");
    autoFill.checked = localStorage.getItem("auto-align") === "true";
    autoFill.onclick = e => { localStorage.setItem("auto-align", autoFill.checked); alignScroll() }
});

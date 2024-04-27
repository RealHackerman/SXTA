export {init, setOverlayShown, showDialogue, hideDialogue}
import sheet from '/assets/styles/dialogue.css' with { type: 'css' };

function init() {
    document.adoptedStyleSheets = [sheet];
    let overlay = document.createElement("div");
    overlay.id="bg-overlay";
    overlay.addEventListener("click", function() {
        setOverlayShown(false);
        let dialogues = document.querySelectorAll(".dialogue");
        for (let i=0; i<dialogues.length; i++) {
            hideDialogue(dialogues[i]);
        }
    });
    document.body.appendChild(overlay);
}

function setOverlayShown(state) {
    if (state) {
        document.getElementById("bg-overlay").style.display = "block";
        setTimeout(function() {
            document.getElementById("bg-overlay").style.opacity = 1;
        }, 10);
        return;
    }
    document.getElementById("bg-overlay").style.opacity = 0;
    setTimeout(function() {
        document.getElementById("bg-overlay").style.display = "none";
    }, 255);
}

function showDialogue(contentElm, options) {
    if (!options) options = {};
    setOverlayShown(true);
    //.dialogue > .scroll-wrap > [contentElm]
    let elm = document.createElement("DIV");
    elm.className = "dialogue";
    if (options.dynamicHeight) elm.classList.add("dynamic-height");
    if (options.fixedPosition) elm.classList.add("fixed-position");
    let icon = document.createElement("DIV");
    icon.className = "dialogue-close-btn";
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 121.31 122.876" enable-background="new 0 0 121.31 122.876" xml:space="preserve"><g><path fill-rule="evenodd" clip-rule="evenodd" d="M90.914,5.296c6.927-7.034,18.188-7.065,25.154-0.068 c6.961,6.995,6.991,18.369,0.068,25.397L85.743,61.452l30.425,30.855c6.866,6.978,6.773,18.28-0.208,25.247 c-6.983,6.964-18.21,6.946-25.074-0.031L60.669,86.881L30.395,117.58c-6.927,7.034-18.188,7.065-25.154,0.068 c-6.961-6.995-6.992-18.369-0.068-25.397l30.393-30.827L5.142,30.568c-6.867-6.978-6.773-18.28,0.208-25.247 c6.983-6.963,18.21-6.946,25.074,0.031l30.217,30.643L90.914,5.296L90.914,5.296z"/></g></svg>`;
    icon.addEventListener("click", function() {
        hideDialogue(elm);
    });
    elm.appendChild(icon);
    let scrollWrap = document.createElement("DIV");
    scrollWrap.className = "scroll-wrap";
    scrollWrap.appendChild(contentElm);
    elm.appendChild(scrollWrap);
    document.body.appendChild(elm);
    setTimeout(function() {
        elm.style.opacity = "1";
    }, 10);
}

function hideDialogue(elm) {
    let dialogues = document.querySelectorAll(".dialogue");
    if (dialogues.length === 1) setOverlayShown(false);
    elm.style.opacity = 0;
    setTimeout(function() {
        elm.style.display = "none";
        elm.parentElement.removeChild(elm);
    }, 255);
}
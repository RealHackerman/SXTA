import * as dialogue from "/assets/scripts/dialogue.js";
import * as classes from "/assets/scripts/classes.js";
import * as dashboard from "/assets/scripts/dashboard.js";
import * as timeteable from "/assets/scripts/timetable.js";
export {loadPage}
dialogue.init();

//navigation
const navBar = document.getElementsByTagName("nav")[0];
var lastCapturedScreenshot;

function navIconClick(e) {
    let page = e.id.split("-")[1];
    loadPage(page);
}

function loadPage(page, ignoreHistoryState) {
    if (!ignoreHistoryState) history.pushState({}, "", "/app/" + page);
    let navIcons = Array.from(document.querySelectorAll("nav > div"));
    for (let i=0; i<navIcons.length; i++) {
        navIcons[i].setAttribute("class", "");
    }
    try {
        document.getElementById("nav-" + page).setAttribute("class", "selected");
    } catch(err) {
        console.error(new Error("Failed to select chosen tab", {cause: err}));
    }
    req("app/" + page, "GET")
    .then(function(res) {
        if (res.responseURL.endsWith("/signin")) window.location.href = "/signin";
        let data = res.responseText;
        if (!data) throw "Error: no response.";
        let shadowBody = document.createElement("html");
        shadowBody.innerHTML = data;
        document.querySelector("main").outerHTML = shadowBody.querySelector("main").outerHTML;
        renderPage(page);
    })
    .catch(err => {
        console.error(err);
        document.querySelector("main").outerHTML = `
        <main>
            <h2>Something went wrong</h2>
            <div>We can't connect to this page right now. Try reloading the app.</div>
        </main>`;
    });
}

function renderPage(page) {
    if (page.startsWith("class")) page = "class";
    switch (page) {
        case "dashboard":
            dashboard.load();
            break;
        case "class":
            classes.load();
            break;
        case "timetable":
            timeteable.load();
            break;
        default:
            console.debug(`No render function set for '${page}'`)
    }
}

function addClassIcons() {
    return new Promise((resolve, reject) => {
        req("internal-api/subjects", "POST")
        .then(res=>{
            let subjects = res.responseJSON;
            subjects.forEach(subject => {
                let elm = document.createElement("div");
                let id = `${subject.programme}${subject.metaclass}/${subject.code||"class"}`;
                if ("class/"+id === window.location.pathname.slice(5)) {
                    elm.setAttribute("class", "selected");
                }
                let title = subject.title;
                let subtitle = "";
                if (title.startsWith("SACE Stage 2 ")) {
                    title = title.split("SACE Stage 2 ").slice(-1)[0];
                    subtitle = "SACE Stage 2";
                }
                elm.id = "nav-class/" + id;
                let chosenIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-25 -15 153.19 152.88"><path d="M17.16 0h82.72a3.32 3.32 0 013.31 3.31v92.32c-.15 2.58-3.48 2.64-7.08 2.48H15.94c-4.98 0-9.05 4.07-9.05 9.05s4.07 9.05 9.05 9.05h80.17v-9.63h7.08v12.24c0 2.23-1.82 4.05-4.05 4.05H16.29C7.33 122.88 0 115.55 0 106.59V17.16C0 7.72 7.72 0 17.16 0zm3.19 13.4h2.86c1.46 0 2.66.97 2.66 2.15v67.47c0 1.18-1.2 2.15-2.66 2.15h-2.86c-1.46 0-2.66-.97-2.66-2.15V15.55c.01-1.19 1.2-2.15 2.66-2.15z" fill-rule="evenodd" clip-rule="evenodd"/></svg>`;
                let normifiedTitle = title.toLowerCase();
                const icons = {
                    "bio": `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="-5 -5 132.88 132.88"><g><path d="M76.36,56.15l-2.48-2.48c-0.75-0.75-0.75-1.96,0-2.71c0.75-0.75,1.96-0.75,2.71,0l4.95,4.95c3.9-0.33,7.8-1.03,11.72-2.31 l-15.8-15.8c-0.75-0.75-0.75-1.96,0-2.71c0.75-0.75,1.96-0.75,2.71,0l17.02,17.02c2.91-1.26,5.83-2.87,8.76-4.93l-20.8-20.8 c-0.75-0.75-0.75-1.96,0-2.71c0.75-0.75,1.96-0.75,2.71,0l21.17,21.17c1.46-1.19,2.93-2.49,4.39-3.92c0.76-0.74,1.97-0.72,2.7,0.04 c0.74,0.76,0.72,1.97-0.04,2.7C96.88,62.42,78.4,60.72,59.79,59C41.3,57.3,22.66,55.59,3.28,75.62c-0.74,0.76-1.95,0.77-2.7,0.04 c-0.76-0.74-0.77-1.95-0.04-2.7c18.97-19.61,37.02-19.68,54.88-18.17c-0.55-8.13-0.63-16.46,1.43-25.12 c2.22-9.33,6.9-18.97,16.13-29.04c0.71-0.78,1.92-0.83,2.69-0.12c0.78,0.71,0.83,1.92,0.12,2.69 c-8.72,9.52-13.13,18.59-15.22,27.35c-1.99,8.39-1.86,16.57-1.29,24.58l0.86,0.08c1.03,0.09,2.06,0.19,3.09,0.28 c-0.55-7.75-0.6-15.5,1.33-23.38c2.06-8.38,6.36-16.81,14.66-25.31c0.74-0.76,1.95-0.77,2.7-0.04c0.76,0.74,0.77,1.95,0.04,2.7 c-7.77,7.96-11.78,15.79-13.69,23.56c-1.86,7.56-1.75,15.16-1.19,22.78C70.18,56.02,73.27,56.18,76.36,56.15L76.36,56.15z M39.74,97.9c0.75,0.75,0.75,1.96,0,2.71c-0.75,0.75-1.96,0.75-2.71,0L15.02,78.59c-0.39-0.39-0.57-0.9-0.56-1.4 c-1.65,1.38-3.3,2.91-4.96,4.63c-0.73,0.76-1.94,0.78-2.7,0.05c-0.76-0.73-0.78-1.94-0.05-2.7c18.43-19.13,36.24-17.63,54.84-16.06 c18.2,1.53,37.2,3.13,58.1-16.02c0.78-0.71,1.98-0.66,2.69,0.12c0.71,0.78,0.66,1.98-0.12,2.69 C102.75,67.78,85.03,68.61,68.1,67.46c0.72,8.53,1.07,17.12-0.94,25.89c-2.18,9.53-7.09,19.17-17.24,28.99 c-0.76,0.74-1.97,0.72-2.7-0.04c-0.74-0.76-0.72-1.97,0.04-2.7c9.54-9.24,14.15-18.23,16.17-27.09c1.93-8.48,1.53-16.92,0.81-25.34 c-0.99-0.08-1.99-0.16-2.98-0.25l-1.05-0.09c0.58,7.93,0.75,15.74-1.11,23.61c-2.04,8.57-6.47,17.09-15.39,25.69 c-0.76,0.73-1.97,0.71-2.7-0.05c-0.73-0.76-0.71-1.97,0.05-2.7c8.31-8.01,12.44-15.9,14.32-23.81c1.8-7.56,1.57-15.23,0.98-23.04 c-3.3-0.25-6.58-0.43-9.84-0.42l3.8,3.8c0.75,0.75,0.75,1.96,0,2.71c-0.75,0.75-1.96,0.75-2.71,0l-5.29-5.29 c-0.3-0.3-0.48-0.67-0.54-1.05c-4.09,0.29-8.15,0.98-12.21,2.33l16.77,16.77c0.75,0.75,0.75,1.96,0,2.71 c-0.75,0.75-1.96,0.75-2.71,0L26.44,70.91c-0.26-0.26-0.43-0.58-0.51-0.91c-3.06,1.33-6.11,3.08-9.17,5.36 c0.35,0.07,0.68,0.25,0.96,0.52L39.74,97.9L39.74,97.9z"/></g></svg>`,
                    "faith": `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="-40 -20 167.16 162.88"><style type="text/css">.st0{fill-rule:evenodd;clip-rule:evenodd;}</style><g><polygon class="st0" points="87.16,28.3 87.16,51.47 55.17,51.47 55.17,122.88 31.99,122.88 31.99,51.47 0,51.47 0,28.3 31.99,28.3 31.99,0 55.17,0 55.17,28.3 87.16,28.3"/></g></svg>`,
                    "math": `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="-30 -30 176.32 182.88"><g><path d="M102.67,23.25v-9.59H24.32l42.55,42.77c2.65,2.67,2.64,6.98-0.03,9.63l-43.5,43.17h79.32V99.9h13.65v16.15 c0,3.77-3.06,6.83-6.83,6.83H6.81v-0.02c-1.75,0-3.5-0.67-4.83-2.01c-2.65-2.67-2.64-6.98,0.03-9.63L52.42,61.2L3.47,11.99 C2.02,10.74,1.1,8.89,1.1,6.83C1.1,3.06,4.16,0,7.93,0H109.5c3.77,0,6.83,3.06,6.83,6.83v16.42H102.67L102.67,23.25z"/></g></svg>`,
                    "physics": `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="-15 -7.5 138.22 132.88"><g><path d="M54.11,0c5.65,0,10.45,7.29,13.65,19.07c1.11,4.09,2.06,8.76,2.81,13.87c4.8-1.9,9.32-3.41,13.41-4.5 c11.79-3.12,20.5-2.6,23.33,2.29c2.82,4.89-1.09,12.69-9.69,21.34c-2.98,3-6.55,6.16-10.61,9.37c1.62,1.28,3.17,2.56,4.63,3.82 c-1.33,0.93-2.42,2.16-3.18,3.6c-1.68-1.45-3.48-2.92-5.38-4.41c-3.35,2.49-6.96,4.99-10.8,7.46c-0.22,4.57-0.58,8.95-1.06,13.1 c5.03,2.04,9.75,3.64,13.99,4.76c9.61,2.54,16.34,2.73,17.94-0.03c0.85-1.47,0.25-3.78-1.54-6.68c1.45-0.63,2.73-1.59,3.75-2.78 c2.89,4.73,3.7,8.84,1.96,11.85c-2.83,4.89-11.53,5.41-23.33,2.29c-4.09-1.08-8.61-2.6-13.42-4.5c-0.75,5.11-1.7,9.78-2.81,13.87 c-3.2,11.78-8,19.07-13.65,19.07c-5.65,0-10.45-7.29-13.65-19.07c-1.11-4.09-2.06-8.76-2.81-13.87c-1.74,0.69-3.44,1.33-5.09,1.91 c-0.13-1.67-0.66-3.22-1.49-4.57c1.92-0.68,3.9-1.43,5.94-2.26c-0.48-4.15-0.85-8.54-1.06-13.11c-3.84-2.47-7.45-4.97-10.8-7.46 c-4.29,3.34-8.04,6.63-11.13,9.74C7,81.25,3.47,86.99,5.07,89.76c0.89,1.54,3.37,2.16,7.05,1.97c-0.03,0.3-0.04,0.61-0.04,0.92 c0,1.31,0.25,2.56,0.69,3.71C6.9,96.61,2.71,95.27,0.91,92.15c-2.82-4.89,1.09-12.69,9.69-21.34c2.99-3,6.55-6.16,10.61-9.37 c-4.05-3.21-7.62-6.37-10.61-9.37c-8.6-8.65-12.51-16.45-9.69-21.34c2.83-4.89,11.53-5.41,23.33-2.29 c4.09,1.08,8.61,2.59,13.42,4.5c0.27-1.85,0.57-3.64,0.89-5.36c1.39,0.7,2.95,1.09,4.61,1.09l0.09,0c-0.37,1.97-0.7,4.04-1,6.18 c3.83,1.65,7.81,3.53,11.86,5.62c4.06-2.09,8.03-3.97,11.86-5.62c-0.75-5.39-1.72-10.28-2.87-14.51c-2.6-9.58-5.8-15.51-8.99-15.51 c-1.77,0-3.55,1.83-5.22,5.09c-1.29-0.87-2.78-1.46-4.4-1.67C47.22,2.99,50.49,0,54.11,0L54.11,0z M96.79,66.74 c3.67,0,6.65,2.98,6.65,6.65c0,3.67-2.98,6.65-6.65,6.65c-3.67,0-6.65-2.98-6.65-6.65C90.14,69.72,93.11,66.74,96.79,66.74 L96.79,66.74z M22.35,85.79c3.67,0,6.65,2.98,6.65,6.65s-2.98,6.65-6.65,6.65c-3.67,0-6.65-2.98-6.65-6.65S18.68,85.79,22.35,85.79 L22.35,85.79z M43.15,11.76c3.67,0,6.65,2.98,6.65,6.65s-2.98,6.65-6.65,6.65c-3.67,0-6.65-2.98-6.65-6.65S39.48,11.76,43.15,11.76 L43.15,11.76z M54.11,52.6c4.88,0,8.84,3.96,8.84,8.84c0,4.88-3.96,8.84-8.84,8.84c-4.88,0-8.84-3.96-8.84-8.84 C45.27,56.56,49.23,52.6,54.11,52.6L54.11,52.6z M25.14,58.42c3.35-2.49,6.96-4.99,10.8-7.46c0.22-4.56,0.58-8.95,1.06-13.1 c-5.04-2.04-9.75-3.64-13.99-4.77c-9.61-2.54-16.34-2.73-17.94,0.03c-1.6,2.77,1.93,8.51,8.94,15.56 C17.1,51.79,20.85,55.08,25.14,58.42L25.14,58.42z M65.97,88.04c-3.83-1.65-7.81-3.54-11.86-5.63c-4.06,2.09-8.03,3.97-11.86,5.63 c0.75,5.39,1.72,10.28,2.87,14.51c2.6,9.58,5.8,15.51,9,15.51c3.19,0,6.4-5.93,8.99-15.51C64.25,98.32,65.22,93.42,65.97,88.04 L65.97,88.04z M48.92,79.65c-1.32-0.73-2.65-1.48-3.98-2.25l0,0c-0.04-0.02-0.09-0.05-0.13-0.08c-1.31-0.76-2.6-1.52-3.87-2.29 c0.18,2.76,0.41,5.44,0.69,8.02C44.01,82.01,46.45,80.87,48.92,79.65L48.92,79.65z M59.3,43.23c1.33,0.73,2.67,1.49,4.02,2.26 c1.34,0.77,2.66,1.55,3.96,2.34c-0.18-2.75-0.41-5.43-0.69-8.01C64.21,40.87,61.78,42.01,59.3,43.23L59.3,43.23z M72.28,50.96 c3.84,2.47,7.45,4.97,10.8,7.46c4.29-3.34,8.04-6.63,11.13-9.74c7-7.05,10.53-12.79,8.94-15.56c-1.6-2.76-8.33-2.57-17.94-0.03 c-4.24,1.12-8.96,2.72-13.99,4.77C71.7,42.01,72.06,46.39,72.28,50.96L72.28,50.96z M79.08,61.44c-2.1-1.53-4.3-3.07-6.6-4.6 c0.03,1.52,0.05,3.05,0.05,4.6c0,1.55-0.02,3.09-0.05,4.61C74.78,64.52,76.98,62.98,79.08,61.44L79.08,61.44z M67.57,53.66 c-2.15-1.35-4.38-2.69-6.66-4l0,0c-2.28-1.32-4.55-2.57-6.8-3.77c-2.25,1.19-4.52,2.45-6.8,3.77l0,0l-0.01,0 c-2.28,1.32-4.5,2.65-6.65,4c-0.09,2.55-0.14,5.14-0.14,7.78c0,2.64,0.05,5.24,0.14,7.78c2.13,1.33,4.32,2.65,6.57,3.95 c0.01,0,0.06,0.03,0.06,0.03l0.03,0.02c2.29,1.32,4.56,2.58,6.81,3.77c2.23-1.18,4.47-2.42,6.73-3.73 c0.04-0.02,0.08-0.05,0.12-0.07l0,0c2.26-1.31,4.47-2.63,6.6-3.97c0.09-2.54,0.14-5.14,0.14-7.78 C67.71,58.8,67.66,56.21,67.57,53.66L67.57,53.66z M48.91,43.23c-2.47-1.22-4.91-2.36-7.28-3.41c-0.28,2.59-0.51,5.26-0.69,8.02 c1.3-0.79,2.62-1.57,3.96-2.34l0,0C46.24,44.72,47.58,43.96,48.91,43.23L48.91,43.23z M29.14,61.44c2.1,1.54,4.3,3.08,6.6,4.61 c-0.03-1.52-0.05-3.06-0.05-4.61c0-1.55,0.02-3.09,0.05-4.61C33.44,58.36,31.23,59.9,29.14,61.44L29.14,61.44z M59.29,79.65 c2.48,1.22,4.91,2.36,7.29,3.41c0.28-2.59,0.51-5.26,0.69-8.02c-1.3,0.79-2.62,1.57-3.97,2.35l-0.07,0.04 C61.92,78.19,60.6,78.93,59.29,79.65L59.29,79.65z"/></g></svg>`
                }
                for (let option in icons) {
                    if (normifiedTitle.includes(option)) {
                        chosenIcon = icons[option];
                        break;
                    }
                }
                elm.innerHTML = `
                    ${chosenIcon}
                    <div>
                        <span class="nav-subtitle">${subtitle}</span>
                        <span>${title}</span>
                    </div>
                `;
                navBar.appendChild(elm);
            });
            resolve();
        })
        .catch(err => {
            let elm = document.createElement("div");
            elm.innerText = "Couldn't load classes";
            elm.className = "error-generic";
            navBar.appendChild(elm);
            reject(new Error("Failed to load list of classes", {cause: err}));
        });
    });
}

function setupNavBar() {
    let navIcons = Array.from(document.querySelectorAll("nav > div"));
    for (let i=0; i<navIcons.length; i++) {
        navIcons[i].addEventListener("click", function() {
            navIconClick(this);
        });
    }
}

function addNavLinks() {
    let navLinksElm = document.createElement("section");
    navLinksElm.id = "nav-links";
    let links = [
        {
            label: "Send Feedback",
            function: sendFeedback
        },
        {
            label: "Privacy & Security",
            function: function() {
                window.location.href = "/privacy";
            }
        }
    ];
    links.forEach(link => {
        let wrapDiv = document.createElement("div");
        let btnElm = document.createElement("span");
        btnElm.className = "inline-btn";
        btnElm.innerText = link.label;
        btnElm.addEventListener("click", link.function);
        wrapDiv.appendChild(btnElm);
        navLinksElm.appendChild(wrapDiv);
    });
    navBar.appendChild(navLinksElm);
}

window.addEventListener("popstate", function(e) {
    loadPage(e.currentTarget.location.pathname.slice(5), true);
});

addClassIcons()
    .then(setupNavBar)
    .then(addNavLinks)
    .catch(err => {
        console.error(err);
        showErrorDialogue(err);
    });
renderPage(window.location.pathname.slice(5));

function showErrorDialogue(err) {
    let elm = document.createElement("div");
    elm.innerHTML = `
    <h2 class="error-generic">
        Something went wrong
    </h2>
    <p>
        We couldn't load the app interface. <br />
        Try clearing your cookies and reloading the app. <br />
        You can try to use the app anyway, but some features might not work properly.
    </p>
    Here's some more info:
    <div style="margin: 8px 24px 48px 24px; font-family: monospace">
        ${err.stack ? err.stack : err} <br />
        ${err.cause ? "Cause: " + err.cause : ""} <br />
    </div>
    <small>:(</small>
    `;
    dialogue.showDialogue(elm);
}

//Feedback form
function sendFeedback() {
    window.location.href = "mailto:sxta@atlasweb.dev";
    return;
    let contentElm = document.createElement("div");
    contentElm.className = "send-feedback-dialogue";
    contentElm.innerHTML = `
        <h2>Send Feedback</h2>
        <p>
            Thank you for taking the time to provide feedback.
            We rely on your feedback to make the client better.
        </p>
        <p>
            <b>Describe your feedback</b>
        </p>
        <div class='input-group'>
            <textarea rows='4' name='feedback-text' id='feedback-text' placeholder=' ' type='text' autocomplete='off'></textarea>
            <label for='feedback-text'>Feedback</label>
            <div></div>
        </div>
    `;
    let textElm = contentElm.lastElementChild.firstElementChild;
    textElm.addEventListener("input", function(e) {
        this.style.height = "auto";
        this.style.height = `${this.scrollHeight-32}px`;
    });
    let ssInfo = document.createElement("div");
    ssInfo.innerHTML = `
    <p>
        <b id='feedback-screenshot-title'>Attach screenshot (optional)</b>
    </p>
    <p id='feedback-screenshot-info'>
        A screenshot helps us better understand your feedback.
    </p>`;
    contentElm.appendChild(ssInfo);
    let screenshotBtn = document.createElement("button");
    screenshotBtn.id = "feedback-screenshot-btn"
    screenshotBtn.innerText = "Capture screenshot";
    screenshotBtn.addEventListener("click", function(e) {
        captureScreenshot().then(img => {
            document.getElementById("feedback-screenshot-title").innerText = "Attached screenshot";
            document.getElementById("feedback-screenshot-info").style.display = "none";
            document.getElementById("feedback-screenshot-btn").style.display = "none";
            document.getElementById("feedback-screenshot-wrapper").style.display = "block";
            document.getElementById("feedback-screenshot-wrapper").appendChild(img);
            document.getElementById("feedback-submit-btn").setAttribute("data-screenshot-loaded", true);
        }).catch(err => {
            console.error(new Error("Failed to capture screenshot", {cause: err}));
        });
    });
    contentElm.appendChild(screenshotBtn);
    let ssWrapper = document.createElement("div");
    ssWrapper.id = 'feedback-screenshot-wrapper';
    contentElm.appendChild(ssWrapper);
    let consentBtn = document.createElement("div");
    consentBtn.innerHTML = `
        <input type='checkbox' id='feedback-contact-consent' />
        <label class='middle' for='feedback-contact-consent'></label>
        <span>Contact me with further questions or updates (optional)</span>
    `;
    contentElm.appendChild(consentBtn);
    let disclaimer = document.createElement("p");
    disclaimer.innerHTML = `
        <i>
        </i>
    `;
    contentElm.appendChild(disclaimer);
    let submitBtn = document.createElement("div");
    submitBtn.innerHTML = `
        <button id="feedback-submit-btn">Send</button>
    `;
    submitBtn.firstElementChild.addEventListener("click", async function() {
        let imgBuffer = null;
        let feedbackElm = document.getElementById("feedback-text");
        let feedbackText = feedbackElm.value;
        if (!feedbackText || feedbackText.length === 0) return raiseInputError(feedbackElm, "Please enter your feedback");
        if (feedbackText.length > 4000) return raiseInputError(feedbackElm, "Please keep your feedback to less than 4000 characters");
        if (document.getElementById("feedback-submit-btn").getAttribute("data-screenshot-loaded")) {
            imgBuffer = await lastCapturedScreenshot.arrayBuffer()
        }
        req(`internal-api/send-feedback?description=${encodeURIComponent(feedbackText)}&contactConsent=${encodeURIComponent(document.getElementById("feedback-contact-consent").checked)}`, "POST", imgBuffer)
        .catch(err => {
            console.error(new Error("Failed to send feedback", {cause:err}));
        });
        dialogue.hideDialogue(document.getElementsByClassName("send-feedback-dialogue")[0].parentElement.parentElement);
    });
    contentElm.appendChild(submitBtn);
    dialogue.showDialogue(contentElm);
}

let track;
function captureScreenshot() {
    return new Promise(function(resolve, reject) {
        let dialogues = Array.from(document.getElementsByClassName("dialogue"));
        dialogues.push(document.getElementById("bg-overlay"));
        for (let i=0; i<dialogues.length; i++) {
            if (getComputedStyle(dialogues[i]).display === "block") {
                dialogues[i].setAttribute("data-sshiden", true);
                dialogues[i].style.display = "none";
            }
        }
        navigator.mediaDevices.getDisplayMedia({
            video: {
                displaySurface: "browser",
            },
            audio: false,
            preferCurrentTab: true,
            selfBrowserSurface: "include",
            systemAudio: "exclude",
            surfaceSwitching: "exclude",
            monitorTypeSurfaces: "exclude",
        }).then(mediaStream => {
            track = mediaStream.getVideoTracks()[0];
            let capture = new ImageCapture(track);
            return capture.grabFrame();
        }).then((bmp) => {
            const canvas = document.createElement('canvas');
            canvas.width = bmp.width;
            canvas.height = bmp.height;
            const ctx = canvas.getContext('bitmaprenderer');
            ctx.transferFromImageBitmap(bmp);
            return new Promise((res) => canvas.toBlob(res));
        }).then(imgBlob => {
            const img = new Image();
            img.src = URL.createObjectURL(imgBlob);
            track.stop();
            for (let i=0; i<dialogues.length; i++) {
                if (dialogues[i].getAttribute("data-sshiden") === "true") {
                    dialogues[i].setAttribute("data-sshiden", false);
                    dialogues[i].style.display = "block";
                }
            }
            lastCapturedScreenshot = imgBlob;
            resolve(img);
        }).catch(err => {
            reject(new Error("Failed to capture screenshot", {cause: err}));
        });
    });
}
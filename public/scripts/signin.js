import * as dialogue from "/assets/scripts/dialogue.js";
dialogue.init();

const sidRegex = /^[A-Za-z0-9\.]+$/;
var sidDetails;

var spinner = document.createElement("template");
spinner.innerHTML = `
<svg class="spinner" width="17" height="17" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
   <circle class="spinner-path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>
</svg>`;
spinner = spinner.content.firstElementChild;

document.getElementById("session-id").addEventListener("input", function(e) {
    clearInputError(this);
});

function slideOutElm(elm, toLeft) {
    elm.style.left = `${toLeft ? -100 : 100}%`;
    elm.style.transform = "scale(0.75,0.75)";
}

function slideInElm(elm) {
    elm.style.display = "block";
    document.getElementsByTagName("main")[0].style.height = 
        elm.getBoundingClientRect().height*(4/3) + heightDiff.value + "px";
    setTimeout(function() {
        elm.style.transform = "scale(1,1)";
        elm.style.left = 0;
    }, 10);
    setTimeout(function() {
        document.getElementsByTagName("main")[0].style.height = "fit-content";
    }, 250);
}

var heightDiff = {
    value: 0,
    update: function(contentElm) {
        let oldMainHeight = document.getElementsByTagName("main")[0].getBoundingClientRect().height;
        let contentHeight = contentElm.getBoundingClientRect().height;
        return (this.value = oldMainHeight - contentHeight - 2);
    }
};

function disableBtn(btn) {
    btn.disabled = "disabled";
    btn.removeChild(btn.firstChild);
    btn.appendChild(spinner);
}

function enableBtn(btn, btnText) {
    btn.disabled = "";
    btn.removeChild(btn.firstChild);
    btn.append(btnText);
}

document.getElementById("SID-info-btn").addEventListener("click", function() {
    let elm = document.createElement("DIV");
    elm.className = "help-dialogue";
    elm.innerHTML = `<h2>How to find your Session ID</h2>`;

    let firstOption = document.createElement("DIV");
    firstOption.innerHTML = `<div>The Session ID Finder is the easiest way to find your Session ID.</div>`;
    let downloadBtn = document.createElement("button");
    downloadBtn.addEventListener("click", function() {
        window.open("/download-app", '_blank').focus();
    });
    downloadBtn.id = "download-app-btn";
    downloadBtn.innerText = "Download Session ID Finder";
    firstOption.appendChild(downloadBtn);
    elm.appendChild(firstOption);

    let secondOption = document.createElement("DIV");
    secondOption.innerHTML = `
            Alternatively, you can find your Session ID manually:
            <ol>
                <li>Visit your usual SEQTA dashboard. Ensure you're signed in.</li>
                <li>Press <code>ctrl + shift + i</code> on your keyboard.</li>
                <li>Press <code>ctrl + shift + p</code> on your keyboard.</li>
                <li>Type <code>network</code> and then press enter.</li>
                <li>Press <code>ctrl + r</code> on your keyboard.</li>
                <li>Scroll to the list that appears and click the first item.</li>
                <li>In the block that appears on the right, click the <code>cookies</code> tab.</li>
                <li>In the table that appears, copy the value next to <code>JSESSIONID</code>. This value should start with <code>node0</code>.</li>
                <li>You have successfully copied your Session ID!</li>
            </ol>
    `;
    elm.appendChild(secondOption);

    dialogue.showDialogue(elm);
});

document.getElementById("SID-form").addEventListener("submit", async function(e) {
    e.preventDefault();
    let sidElm = document.getElementById("session-id");
    let sid = sidElm.value;
    if (sid.length < 30 || sid.length > 50 || !sidRegex.test(sid)) 
        return raiseInputError(sidElm, "This Session ID doesn't look right. Press 'Learn how to find your Session ID' for help.");
    disableBtn(document.getElementById("SID-continue-btn"));
    let sidRequestResponse = await req("internal-api/check-SID", "POST", JSON.stringify({
        "sid": sid
    }))
    .catch(err => {
        enableBtn(document.getElementById("SID-continue-btn"), "Continue");
        console.log(err);
        return raiseInputError(document.getElementById("session-id"), "Something went wrong. Try again or check the support page.");
    });
    enableBtn(document.getElementById("SID-continue-btn"), "Continue");
    if (!sidRequestResponse.responseJSON.exists) {
        return raiseInputError(
            sidElm, 
            "That Session ID didn't work. Try again or press 'Learn how to find your Session ID' for help."
        );
    }
    sidDetails = sidRequestResponse.responseJSON;
    Array.from(document.getElementsByClassName("selected-user-text")).forEach(elm => {
        elm.innerText = sidDetails.name;
    });
    heightDiff.update(this);
    slideOutElm(this, true);
    let mainElm = document.getElementsByTagName("main")[0];
    let oldMainHeight = mainElm.getBoundingClientRect().height;
    mainElm.style.height = oldMainHeight + "px";
    setTimeout(function() {
        slideInElm(document.getElementById("confirm-form"));
        document.getElementById("SID-form").style.display = "none";
    }, 250);
});

document.getElementById("selected-user").addEventListener("click", function(e) {
    if (!e.clientX && !e.clientY) return;
    e.preventDefault();
    let confirmFormElm = document.getElementById("confirm-form");
    heightDiff.update(confirmFormElm);
    slideOutElm(confirmFormElm, false);
    let mainElm = document.getElementsByTagName("main")[0];
    let oldMainHeight = mainElm.getBoundingClientRect().height;
    mainElm.style.height = oldMainHeight + "px";
    setTimeout(function() {
        slideInElm(document.getElementById("SID-form"));
        document.getElementById("confirm-form").style.display = "none";
    }, 250);
});

document.getElementById("confirm-form").addEventListener("submit", function(e) {
    e.preventDefault();
    disableBtn(document.getElementById("submit-btn"));
    req("internal-api/set-SID-cookie", "POST", JSON.stringify({
        "sid": sidDetails.sid,
        "uid": sidDetails.uid
    }))
    .then(req => {
        let res = req.responseJSON;
        if (!res.exists) {
            enableBtn(document.getElementById("submit-btn"), "Continue");
            alert("Something went wrong. Try refreshing the page.");
            return;
        }
        window.location.href = "/app/dashboard";
    })
    .catch(err => {
        enableBtn(document.getElementById("submit-btn"), "Continue");
        console.error(err);
        alert("Something went wrong. Try again or check the support page.");
    });
});
const elm = document.getElementById("time");
const title2 = document.getElementById("title-2");
const title3 = document.getElementById("title-3");
const footer = document.getElementById("footer-text");
const launch = document.getElementById("launch");
const wipes = document.getElementsByClassName("wipe");
const targetTime = 1714519800000;

launch.addEventListener("click", function() {
    this.setAttribute("disabled", "disabled");
    document.getElementsByTagName("main")[0].style.opacity = 0;
    document.getElementsByTagName("footer")[0].style.opacity = 0;
    document.getElementsByTagName("body")[0].className = "launch";
    setTimeout(function() {
        document.getElementsByTagName("main")[0].style.display = "none";
        document.getElementsByTagName("footer")[0].style.display = "none";
        document.getElementById("countdown").style.display = "block";
        for (let i=0; i<wipes.length; i++) {
            wipes[i].style.display = "block";
        }
        let countdownItems = document.getElementById("countdown").children;
        setTimeout(function() {
            countdownItems[0].style.opacity = 1;
            countdownItems[0].style.fontSize = "150px";
        }, 100);
        setTimeout(function() {
            countdownItems[0].style.opacity = 0;
            countdownItems[1].style.opacity = 1;
            countdownItems[1].style.fontSize = "250px";
        }, 1100);
        setTimeout(function() {
            countdownItems[1].style.opacity = 0;
            countdownItems[2].style.opacity = 1;
            countdownItems[2].style.fontSize = "300px";
        }, 2100);
        setTimeout(function() {
            countdownItems[2].style.opacity = 0;
            countdownItems[3].style.opacity = 1;
            countdownItems[3].style.fontSize = "280px";
            doWipes();
        }, 3100);
        setTimeout(function() {
            countdownItems[3].style.opacity = 0;
            countdownItems[3].style.fontSize = "1px";
        }, 4100);
        setTimeout(function() {
            doWipes();
        }, 4210);
        setTimeout(function() {
            doWipes();
            document.body.style.padding = "100px";
            document.body.style.textAlign = "center";
            document.body.innerHTML =`<h1>SXTA</h1> <br /> Made with <span style="color: white;">&#10084;</span> by Luke`;
        }, 5320);
        setTimeout(function() {
            window.location.href = "/";
        }, 6320);
    }, 3000);
});

function doWipes() {
    const mult = 1.5;
    setTimeout(function() {
        wipes[0].style.height = "100%";
    }, 0*mult)
    setTimeout(function() {
        wipes[1].style.height = "100%";
        document.getElementsByTagName("body")[0].style.backgroundColor = "red";
    }, 80*mult);
    setTimeout(function() {
        wipes[2].style.height = "100%";
    }, 160*mult);
    setTimeout(function() {
        wipes[3].style.height = "100%";
    }, 240*mult);
    setTimeout(function() {
        wipes[4].style.height = "100%";
    }, 320*mult);
    setTimeout(function() {
        wipes[4].style.height = "0";
    }, 420*mult);
    setTimeout(function() {
        wipes[3].style.height = "0";
    }, 500*mult);
    setTimeout(function() {
        wipes[2].style.height = "0";
    }, 580*mult);
    setTimeout(function() {
        wipes[1].style.height = "0";
    }, 660*mult);
    setTimeout(function() {
        wipes[0].style.height = "0";
    }, 740*mult);
}

function updateClock() {
    const diff = targetTime - new Date().getTime();
    if (diff < 0) {
        clearInterval(interval);
        elm.innerText = "It is done.";
        title2.innerText = "We're ready when you are."
        title3.innerText = "";
        launch.style.display = "block";
        footer.innerText = "🚀🚀🚀";
        return;
    }
    let periods = [
        Math.floor(diff/1000/60/60/24), // days
        Math.floor(diff/1000/60/60 % 24).toString().padStart(2, "0"), //hours
        Math.floor(diff/1000/60 % 60).toString().padStart(2, "0"), //minutes
        Math.floor(diff/1000 % 60).toString().padStart(2, "0"), //seconds
        Math.floor(diff % 1000).toString().padStart(3, "0"), //ms
    ];
    let text = "";
    for (let i=0; i<periods.length; i++) {
        text = text.concat(periods[i]);
        if (typeof periods[i+1] !== "undefined") text = text.concat(":");
    }
    elm.innerText = text;
}

const interval = setInterval(updateClock, 1);
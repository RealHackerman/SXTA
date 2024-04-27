export {load}
import {loadPage} from "./app.js"

const firstRowStartHour = 8;
const randomTimetableColours = true;
const seedConstant = 6;

function load() {
    //let today = new Date();
    let today = new Date("10 April 2024");
    let lastMonday = new Date((today.getTime() - (today.getDay()-1)*1000*60*60*24));
    let nextSunday = new Date((today.getTime() + (7-today.getDay())*1000*60*60*24));
    const tableDateElms = document.querySelectorAll("#timetable thead td > .date-box > b");
    let seqtaDateToTableColumnMap = {};
    for (let i=0; i<7; i++) {
        let thisDate = new Date(lastMonday.getTime() + i*1000*60*60*24);
        tableDateElms[i].innerText = thisDate.getDate();
        seqtaDateToTableColumnMap[seqtaFormatDate(thisDate)] = i;
    }
    const title = document.getElementById("timetable-title");
    title.innerText = lastMonday.toLocaleDateString("en-AU", {month: "long"});
    if (nextSunday.getMonth() !== lastMonday.getMonth()) 
        title.innerText += (" - " + nextSunday.toLocaleDateString("en-AU", {month: "long"}));
    req("internal-api/timetable", "POST", JSON.stringify({
        startDate: seqtaFormatDate(lastMonday),
        endDate: seqtaFormatDate(nextSunday)
    }))
    .then(res => {
        let classes = res.responseJSON.items;
        const rows = document.querySelectorAll("#timetable > tbody > tr");
        classes.sort((a, b) => {
            if (a.date !== b.date) return parseSeqtaDate(a.date)>parseSeqtaDate(b.date) ? 1 : -1
            if (a.from === b.from) return 0;
            return parseSeqtaTime(a.from)>parseSeqtaTime(b.from) ? 1 : -1;
        });
        for (let i=0; i<classes.length-1; i++) {
            if (classes[i].code === classes[i+1].code && classes[i].until === classes[i+1].from) {
                classes[i].until = classes[i+1].until;
                classes.splice(i+1, 1);
                i -= 1;
            }
        }
        classes.forEach(item => {
            //find correct table elm
            let startTime = item.from.split(":");
            let endTime = item.until.split(":");
            let column = seqtaDateToTableColumnMap[item.date];
            let row = startTime[0] - firstRowStartHour;
            if (row < 0) throw "Class scheduled before calendar starts.";
            if (row > rows.length) throw "Class scheduled after calendar ends.";

            //create entry
            let elm = document.createElement("div");
            let title = item.programme || item.description;
            let subtitle;
            if (title.startsWith("SACE Stage 2 ")) {
                title = title.split("SACE Stage 2 ").slice(-1)[0];
                subtitle = "SACE Stage 2";
            }
            elm.innerHTML = `
                <b>${title}</b>
                <span>${startTime[0]}:${startTime[1]} - ${endTime[0]}:${endTime[1]}</span>
                <span>${item.staff}</span>
                <span>${item.room}</span>
            `;
            let duration = parseSeqtaTime(item.until).getTime() - parseSeqtaTime(item.from).getTime();
            duration /= (1000*60*60);
            if (duration < 0) throw "A class must not finish before it starts.";
            elm.style.top = `${(parseInt(startTime[1])/60)*100}%`;
            elm.style.height = `calc(${duration*100}% - 12px)`;
            if (item.programmeID) {
                elm.addEventListener("click", function() {
                    loadPage(`class/${item.programmeID}${item.metaID}/${item.code}`)
                });
            } else {
                elm.style.cursor = "default";
            }
            if (randomTimetableColours) elm.style.backgroundColor = seededRandomColor(item.code);
            //append to table elm
            rows[row].children[column].appendChild(elm);
        });
    })
    .catch(err => {
        console.error(err);
        let timetable = document.getElementById("timetable");
        timetable.innerHTML = "Couldn't load timetable";
        timetable.classList.add("error-generic");
    });
}

function seqtaFormatDate(date) {
    let month = [date.getMonth()+1].toString();
    if (month.length === 1) month = "0" + month;
    let dayDate = [date.getDate()].toString();
    if (dayDate.length === 1) dayDate = "0" + dayDate;
    return `${date.getFullYear()}-${month}-${dayDate}`
}

function parseSeqtaDate(date) {
    date = date.split("-");
    return new Date(Date.UTC(date[0], parseInt(date[1])-1, date[2]));
}

function parseSeqtaTime(time) {
    time = time.split(":");
    return new Date(Date.UTC(2000, 0, 0, time[0], time[1], time[2]));
}

function seededRandomColor(seed) {
    seed = parseInt(new TextEncoder().encode(seed).toString().replaceAll(",", ""));
    for (let i=0; i<seedConstant; i++) {
        seed = (seed * 185852 + 1) % 34359738337;
    }
    seed = (seed/(10**(Math.floor(Math.log10(seed))+1))) * 1000000000;
    seed = seed.toString();
    seed = [seed.slice(0,3), seed.slice(3,6), seed.slice(6,9)];
    seed = seed.map(x => {
        return Math.round(x/1000*255);
    });
    return `rgb(${seed[0]},${seed[1]},${seed[2]})`;
}
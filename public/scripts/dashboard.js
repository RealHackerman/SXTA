export {load}
import { showTask } from "./task-dialogue.js";
import { renderTask } from "./classes.js";

function updateCalendar() {
    const currentTime = new Date().getTime();
    const calendar = document.getElementById("calendar");
    const calendarHead = document.getElementById("calendar-head");
    for (let i=0; i<7; i++) {
        let elm = document.createElement("td");
        const localTime = new Date(currentTime + i*1000*60*60*24);
        elm.innerText = localTime.toLocaleDateString("en-AU", {weekday: "long"});
        calendarHead.appendChild(elm);
    }
    const calendarRows = [
        document.getElementById("calendar-row-1"),
        document.getElementById("calendar-row-2")
    ];
    req("internal-api/upcoming", "POST")
    .then(res=>{
        let tasks = res.responseJSON;
        tasks.forEach(task => {
            if (task.task.due - new Date().getTime() - 1000*60*60*24*30 > 0) return;
            document.getElementById("dashboard-upcoming").appendChild(renderTask(task, {showClassCode: true}));
        });
        for (let i=0; i<tasks.length; i++) {
            let dueDate = new Date(tasks[i].task.due);
            tasks[i].task.dueDate = {
                month: dueDate.getMonth(),
                date: dueDate.getDate(),
            };
        }
        for (let i=0; i<14; i++) {
            let tdElm = document.createElement("td");
            const localTime = new Date(currentTime + i*1000*60*60*24);
            const dueToday = tasks.filter(task => {
                if (
                    task.task.dueDate.month === localTime.getMonth()
                    && task.task.dueDate.date === localTime.getDate()
                ) return true;
                return false;
            });
            let dateElm = document.createElement("span");
            dateElm.innerText = localTime.getDate();
            tdElm.appendChild(dateElm);
            dueToday.forEach(task => {
                let taskElm = document.createElement("div");
                taskElm.innerText = task.task.name;
                taskElm.addEventListener("click", function(){showTask(task)})
                tdElm.appendChild(taskElm);
            });
            let row = i < 7 ? 0 : 1
            calendarRows[row].appendChild(tdElm);
        }
    })
    .catch(err => {
        console.error(err);
        calendar.classList.add("error-generic");
        calendar.innerHTML = "Couldn't load calendar";
    });
}

function load() {
    updateCalendar();
}
export {load, renderTask}
import { showTask, shortMonths } from "./task-dialogue.js";
import { showDialogue, hideDialogue } from "./dialogue.js";

let shownLesson;
let lessons;

function searchLessons(e) {
    let query = "";
    if (e) query = e.srcElement.value.toLowerCase();
    let indicies = [];
    //very basic search function - practically useless - for testing only
    for (let i=0; i<lessons.length; i++) {
        for (let f=0; f<lessons[i].lessons.length; f++) {
            let x = lessons[i].lessons[f];
            if (
                (x.content.title || "").toLowerCase().includes(query) ||
                (x.content.description || "").toLowerCase().includes(query) || 
                (x.content.homework || "").toLowerCase().includes(query) || 
                (new Date(x.date).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "long",
                    weekday: "long",
                })).toLowerCase().includes(query)
            ) indicies.push([i,f]);
        }
    }
    // indicies.splice(12);
    let wrapper = document.createElement("DIV");
    let parentDialogueElm = document.getElementById("search-results").parentElement.parentElement.parentElement;
    indicies.forEach(index => {
        let result = lessons[index[0]].lessons[index[1]];
        let resultElm = document.createElement("DIV");
        resultElm.innerHTML = `
        <b>${result.content.title || (new Date(result.date).toLocaleDateString("en-AU", {
            day: "numeric",
            month: "long"
        }) + " Lesson")}</b>
            - 
        ${new Date(result.date).toLocaleDateString("en-AU", {
            day: "numeric",
            month: "long"
        })} <br />
        `;
        resultElm.addEventListener("click", function() {
            showLesson(index[0], index[1])
            hideDialogue(parentDialogueElm);
        });
        wrapper.appendChild(resultElm);
    });
    let scrollWrap = document.getElementById("search-results").parentElement;
    parentDialogueElm.style.height = parentDialogueElm.getBoundingClientRect().height + "px";
    setTimeout(function() {
        document.getElementById("search-results").innerHTML = "";
        document.getElementById("search-results").appendChild(wrapper);
        let contentHeight = scrollWrap.getBoundingClientRect().height+ "px";
        parentDialogueElm.style.height = contentHeight;
    }, 1);
}

function load() {
    document.getElementById("previous-lesson-btn").addEventListener("click", function() {
        let [index, lessonNumber] = shownLesson;
        lessonNumber--;
        if (lessonNumber < 0) {
            index--;
            lessonNumber = lessons[index].lessons.length + lessonNumber;
        }
        showLesson(index, lessonNumber);
    });
    document.getElementById("next-lesson-btn").addEventListener("click", function() {
        let [index, lessonNumber] = shownLesson;
        lessonNumber++;
        if (lessonNumber > lessons[index].lessons.length) {
            index++;
            lessonNumber = 0;
        }
        showLesson(index, lessonNumber);
    });
    document.getElementById("search-lesson-btn").addEventListener("click", function() {
        let searchDialogue = document.createElement("DIV");
        searchDialogue.classList.add("search-dialogue");
        let inputGroup = document.createElement("DIV");
        inputGroup.classList.add("input-group");
        let input = document.createElement("input");
        input.autocomplete = "off";
        input.placeholder = " ";
        input.id = "lesson-search";
        input.addEventListener("input", e => searchLessons(e));
        input.addEventListener("keydown", e => selectFirstLesson(e));
        let label = document.createElement("label");
        label.setAttribute("for", "lesson-search");
        label.innerText = "Search for text or dates (beta)"; // for text, files, dates and more"; (coming soon)
        inputGroup.appendChild(input);
        inputGroup.appendChild(label);
        searchDialogue.appendChild(inputGroup);
        let searchResults = document.createElement("DIV");
        searchResults.id = "search-results";
        searchDialogue.appendChild(searchResults);
        showDialogue(searchDialogue, {dynamicHeight: true, fixedPosition: true});
        setTimeout(function() {
            document.getElementById("lesson-search").focus();
            searchLessons();
        }, 5);
    });
    req("internal-api/class-tasks", "POST", JSON.stringify({
        classID: window.location.pathname.split("/")[3]
    }))
    .then(res => {
        const taskList = document.getElementById("task-list");
        const pastTaskList = document.getElementById("past-task-list");
        let tasks = res.responseJSON.sort((a, b) => a.task.due - b.task.due);
        if (tasks.length === 0) {
            taskList.innerText = "No tasks yet :)"
        }
        tasks = tasks.sort((a,b) => {
            return a.task.due > b.task.due;
        });
        let tasksHidden = 0;
        tasks.forEach(task => {
            let taskElm = renderTask(task);
            if (task.task.due > new Date().getTime()) {
                //hide any more than 3 tasks as long as their not due within 2 weeks.
                if (
                    taskList.children.length > 2
                    && task.task.due - new Date().getTime() - 1000*60*60*24*14 > 0
                ) {
                    tasksHidden++;
                    taskElm.setAttribute("data-task-list-hidden", true);
                    taskElm.style.display = "none";
                }
                taskList.appendChild(taskElm);
            } else {
                pastTaskList.appendChild(taskElm);
            }
        });
        if (tasksHidden) {
            let showAllBtn = document.createElement("span");
            showAllBtn.className = "inline-btn";
            showAllBtn.innerText = `${tasksHidden} tasks hidden. Show all.`
            showAllBtn.addEventListener("click", function() {
                this.style.display = "none";
                let upcomingTasks = document.querySelectorAll("#task-list > div");
                for (let i=0; i<upcomingTasks.length; i++ ) {
                    upcomingTasks[i].style.display = "block";
                }
            });
            showAllBtn.style.marginLeft = "6px";
            showAllBtn.style.fontSize = "12px";
            taskList.appendChild(showAllBtn)
        }
    })
    .catch(err => {
        console.error(err);
        document.getElementById("task-list").classList.add("error-generic");
        document.getElementById("task-list").innerHTML = "Failed to load tasks.";
        document.getElementById("past-task-list").classList.add("error-generic");
        document.getElementById("past-task-list").innerHTML = "Failed to load tasks.";
    });

    req("internal-api/lessons", "POST", JSON.stringify({
        classID: window.location.pathname.split("/")[3]
    }))
    .then(res => {
        lessons = res.responseJSON;
        //show next lesson
        let nextLessonLocator;
        let minTime = new Date().setHours(0, 0, 0, 0);
        // let minTime = 0;
        for (let i=0; i<lessons.length; i++) {
            if (nextLessonLocator) break;
            for (let f=0; f<lessons[i].lessons.length; f++) {
                if (lessons[i].lessons[f].startUnixTime > minTime) {
                    nextLessonLocator = [i, f];
                    break;
                }
            }
        }
        showLesson(nextLessonLocator[0], nextLessonLocator[1]);
    })
    .catch(err => {
        console.error(err);
        document.getElementById("next-lesson").classList.add("error-generic");
        document.getElementById("next-lesson").innerHTML = "Failed to load next lesson.";
    });
}

function showLesson(index, lessonNumber) {
    let nextLesson = lessons[index].lessons[lessonNumber];
    shownLesson = [index, lessonNumber];
    let nextLessonElm = document.getElementById("next-lesson");
    let lessonTitle = `${new Date(nextLesson.date).toLocaleDateString("en-AU", {weekday: "long"})}'s Lesson`;
    if (
        nextLesson.startUnixTime < new Date().getTime()+1000*60*60*24
        && nextLesson.startUnixTime > new Date().setHours(0, 0, 0, 0)
    ) lessonTitle = "Today's Lesson";
    nextLessonElm.innerHTML = `
        <h3>${lessonTitle}</h3>
        <div class="lesson-description">
        ${new Date(nextLesson.date).toLocaleDateString("en-AU", {
            day: "numeric",
            month: "long"
        })}
        from ${nextLesson.startTime.slice(0,5)}-${nextLesson.endTime.slice(0,5)}
        </div>
        <h4>${nextLesson.content.title || ""}</h4>
        <div class="lesson-description">${nextLesson.content.description || ""}</div>
        <div class="lesson-description">${nextLesson.content.homework ? "Homework:" : ""} ${nextLesson.content.homework || ""}</div>
    `;
}

function selectFirstLesson(e) {
    if(e.key === 'Enter') {
        let lessonsWrapper = document.getElementById("search-results").children[0];
        if (!lessonsWrapper) return;
        let firstLesson = lessonsWrapper.children[0];
        if (!firstLesson) return;
        firstLesson.click();
    }
}

function renderTask(task, options) {
    if (!options) options = {};
    //create date box      
    console.log(task);
    const dueDate = new Date(task.task.due);      
    let dateBoxMonth = document.createElement("div");
    dateBoxMonth.innerText = shortMonths[dueDate.getMonth()];

    let dateBoxDay = document.createElement("b");
    dateBoxDay.innerText = dueDate.getDate();

    let dateBox = document.createElement("div");
    dateBox.className = "date-box";
    dateBox.appendChild(dateBoxMonth);
    dateBox.appendChild(dateBoxDay);

    //create name
    let nameElm = document.createElement("span");
    nameElm.innerText = task.task.name;
    if (options.showClassCode) nameElm.innerText = `${task.subject.code}: ${task.task.name}`;

    let resultsElm = document.createElement("span");
    if (task.task.results) {
        let grade = task.task.results.grade;
        let percent = task.task.results.percentage;
        if (grade && percent) resultsElm.innerText = `${grade} (${percent}%)`;
        if (!grade && percent) resultsElm.innerText = `${percent}%`;
        if (grade && !percent) resultsElm.innerText = `${grade}`;
        if (!grade && !percent) resultsElm.innerText = `Results released`;
    }

    //create task elm
    let taskElm = document.createElement("div");
    taskElm.addEventListener("click", function(){showTask(task)})
    taskElm.appendChild(dateBox);
    taskElm.appendChild(nameElm);
    if (task.task.results) taskElm.appendChild(resultsElm);
    return taskElm;
}
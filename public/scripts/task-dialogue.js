import { showDialogue } from "./dialogue.js";
export {showTask, shortMonths}

const shortMonths = [
    "Jan.",
    "Feb.",
    "March",
    "April",
    "May",
    "June",
    "July",
    "Aug.",
    "Sept.",
    "Oct.",
    "Nov.",
    "Dec."
];

function showTask(task) {
    req("internal-api/task", "POST", JSON.stringify({
        classID: task.subject.cID,
        taskID: task.task.id
    }))
    .then(res => {
        let taskInfo = {
            details: res.responseJSON
        }
        taskInfo.task = task.task;
        taskInfo.subject = task.subject;
        let dialogueElm = document.createElement("div");
        dialogueElm.className = "task-info-dialogue";
        
        //title
        let titleElm = document.createElement("h2");
        titleElm.innerText = taskInfo.task.name;
        dialogueElm.appendChild(titleElm);

        //due
        let dueDateElm = document.createElement("div");
        const dueDate = new Date(taskInfo.task.due);
        dueDateElm.innerHTML = `
            <div class='date-box'>
                <div>${shortMonths[dueDate.getMonth()]}</div>
                <b>${dueDate.getDate()}</b>
            </div>
            Due ${dueDate.toLocaleDateString("en-AU", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            })}
        `;
        dialogueElm.appendChild(dueDateElm);
        if (taskInfo.details.marked) {
            let resultsElm = document.createElement("div");
            if (taskInfo.details.comment) resultsElm.style.marginBottom = "0";
            resultsElm.innerHTML = `<b>Results</b>`;
            taskInfo.details.criteria.forEach(x => {
                if (!x.results) return;
                if (x.results.label === "Achievement") x.results.label = "";
                if (!x.results.percentage) {
                    return resultsElm.innerHTML += `
                    <div>
                        <i>${x.description || x.results.label || ""}</i>
                    </div>
                    <div class="results-box">
                        <div class='date-box' style="line-height: 40px;">
                            <b>${x.results.grade}</b>
                        </div>
                        Achieved ${x.results.grade}
                    </div>`;
                }
                resultsElm.innerHTML += `
                <div>
                    <i>${x.description || x.results.label || ""}</i>
                </div>
                <div class="results-box">
                    <div class='date-box'>
                        <b>${x.results.grade}</b>
                        <div>${x.results.percentage}%</div>
                    </div>
                    Achieved ${x.results.grade} with ${x.results.percentage}%
                </div>`;
            });
            dialogueElm.appendChild(resultsElm);
            //${taskInfo.details.results.grade} (${taskInfo.details.results.percentage}%
        }

        if (taskInfo.details.comment) {
            let commentElm = document.createElement("div");
            if (!taskInfo.details.marked) commentElm.innerHTML = "<b>Results</b>";
            commentElm.innerHTML += `<div>${taskInfo.details.comment}</div>`;
            dialogueElm.appendChild(commentElm);
        }

        //description
        if (taskInfo.details.description) {
            let descElm = document.createElement("div");
            descElm.innerHTML = `
            <b>Details</b>
            <div>${taskInfo.details.description}</div>
            `;
            dialogueElm.appendChild(descElm);
        }

        //checklist
        if (taskInfo.details.checklist) {
            let checklistElm = document.createElement("ul");
            let checklist = taskInfo.details.checklist;
            checklistElm.className = "checklist";
            checklistElm.innerHTML = `
                <b>Checklist</b>
                <i>(Checklist function in beta, changes will not be saved)</i>`;
            checklist.forEach(item => {
                let checkItemElm = document.createElement("li");

                let checkBoxElm = document.createElement("input");
                let checkBoxLabel = document.createElement("label");
                checkBoxElm.id = `checkbox-${item.id}`;
                checkBoxElm.type = "checkbox";
                checkBoxElm.checked = item.checked;
                checkBoxLabel.setAttribute("for", `checkbox-${item.id}`);
                checkItemElm.appendChild(checkBoxElm);
                checkItemElm.appendChild(checkBoxLabel);

                let checkItemLabel = document.createElement("span");
                checkItemLabel.innerText = item.label;
                checkItemElm.appendChild(checkItemLabel);

                checklistElm.appendChild(checkItemElm);
            });
            dialogueElm.appendChild(checklistElm);
        }
        //rubric
        taskInfo.details.criteria.forEach(x => {
            if (!x.rubric) return;
            let rubricWrap = document.createElement("div");
            rubricWrap.innerHTML = "<b>Rubric</b> <br /><br />";
            let rubricElm = document.createElement("table");
            rubricElm.className = "rubric";
            let rubric = x.rubric;
            let cellReferences = {};
            rubric.forEach(item => {
                let tr = document.createElement("tr");
                let rowHead = document.createElement("td");
                rowHead.innerText = item.content;
                tr.appendChild(rowHead);
                item.descriptors.forEach(descriptor => {
                    let td = document.createElement("td");
                    let id = descriptor.id;
                    td.innerText = descriptor.content;
                    td.id = "rubric-descriptor-" + id;
                    cellReferences[id]=td;
                    tr.appendChild(td);
                });
                rubricElm.appendChild(tr);
            });
            if (x.rubricScore) {
                let scores = x.rubricScore;
                for (let x in scores) {
                    if (!scores[x]) continue;
                    let cell = cellReferences[scores[x].id];
                    if (cell) cell.className = "rubric-selected";
                }
            }
            rubricWrap.appendChild(rubricElm);
            dialogueElm.appendChild(rubricWrap);
        });
        showDialogue(dialogueElm);
    });
}
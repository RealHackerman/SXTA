"use strict";
console.clear();

//dependencies
const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const sanitizeHtml = require("sanitize-html");
const crypto = require("crypto");
const fs = require("fs");
const sanitizeOptions = {
    allowedTags: ["span", "div", "p", "strong", "em", "ul", "ol", "li", "br"],
    nonBooleanAttributes: [
      'selected',
      'checked'
    ],
    allowedAttributes: {},
}
require("dotenv").config();

//configure express/middleware
const app = express();
const http = require("http").createServer(app);
const bodyParser = require('body-parser');
const ejs = require("ejs");
const jsonParser = bodyParser.json();
const cookieParser = require('cookie-parser');
app.use(cookieParser());
// app.use(helmet());
app.use(compression());

//native dependencies
const path = require("path");

//constants
const sidRegex = /^[A-Za-z0-9\.]+$/;

//INTERNAL API
function parseSeqtaDate(date) {
  date = date.split("-");
  return new Date(Date.UTC(date[0], parseInt(date[1])-1, date[2]));
}

function parseSeqtaDateTime(date, time) {
  date = date.split("-");
  time = time.split(":");
  return new Date(Date.UTC(date[0], parseInt(date[1])-1, date[2], time[0], time[1], time[2]));
}

function parseSeqtaTime(time) {
  time = time.split(":");
  return new Date(Date.UTC(2000, 0, 0, time[0], time[1], time[2]));
}

/**
 * Sends a get request to SEQTA.
 * @param {string} endpoint The SEQTA endpoint to GET from.
 * @param {string} SID Valid SEQTA session ID
 */
function getSeqta(endpoint, SID, options) {
  return new Promise((resolve, reject) => {
    if (!SID) {
      return reject(
        new Error("No SID provided to getSeqta function."),
      );
    }
    fetch(`https://${"learn.concordia.sa.edu.au"}/${endpoint}`, {
      "headers": {
        "accept": "text/javascript, text/html, application/xml, text/xml, */*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json; charse:set=UTF-8",
        "sec-ch-ua": "\"Google Chrome\";v=\"107\", \"Chromium\";v=\"107\", \"Not=A?Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        "cookie": `JSESSIONID=${SID};`,
        "Referer": `https://${"learn.concordia.sa.edu.au"}/`,
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": JSON.stringify(options) || "{}",
      "method": "POST"
    })
      .then(res => {
        if (res.status !== 200) return reject(
          new Error("Seqta request returned non-200 HTTP response."),
        );
        console.log(res.text());
        return res.json();
      })
      .then(data => {
        if (data.status !== "200") {
          return reject(
            new Error("Seqta request returned non-200 HTTP response."),
          );
        }
        resolve(data);
      })
      .catch(err => {
        reject(
          new Error("Failed to verify SEQTA response is valid.", {cause: err}),
        );
      });
  });
}

//SEQTA API
/**
 * GET a list of year codes from SEQTA.
 * @param {string} SID
 * @returns {Array}
 */
function getYears(SID) {
  return new Promise((resolve, reject) => {
    getSeqta("seqta/student/load/subjects", SID)
      .then(data => {
        let years = data.payload.map(x => {
          return {
            code: x.code,
            desc: x.description,
            id: x.id,
            active: x.active
          };
        });
        resolve(years);
      })
      .catch(err => {
        reject(
          new Error("Failed to load subjects from SEQTA",{cause: err}),
        );
      });
  });
}

/**
 * GET a list of subjects for a given year from SEQTA. Defaults to subjects in active year.
 * @param {string} SID
 * @param {number} [yearID = active]
 * @returns {Array}
 */
function getSubjects(SID, yearID) {
  return new Promise((resolve, reject) => {
    getSeqta("seqta/student/load/subjects", SID)
      .then(data => {
        let subjects;
        if (yearID) {
          let year = data.payload.find(x => { return (x && x.id === yearID); });
          if (!year) return reject(
            new Error("Specified year does not exist."),
          );
          subjects = year.subjects;
        } else {
          subjects = data.payload.find(x => { return (x && x.active === 1); }).subjects;
        }
        resolve(subjects);
      })
      .catch(err => {
        reject(
          new Error("Failed to load subjects from SEQTA", {cause:err}),
        );
      });
  });
}

/**
 * GET details on a subject from SEQTA. Can only be used on subjects from current year.
 * @param {string} SID
 * @param {string} subjectID
 * @returns {Object}
 */
function getSubject(SID, subject) {
  return new Promise((resolve, reject) => {
    getSubjects(SID)
      .then(data => {
        resolve(data.find(x => {return ("" + x.programme + "" + x.metaclass) === subject}));
      })
      .catch(err => {
        reject(
          new Error("Failed to select specific subject from returned list of all subjects", {cause: err}),
        );
      });
  });
}

/**
 * GET a list of upcoming tasks.
 * @param {string} SID
 * @returns {Array}
 */
function getUpcoming(SID, programme, metaclass) {
  let options;
  if (programme && metaclass) {
    options = {
      programme: programme,
      metaclass: metaclass
    };
  }
  return new Promise((resolve, reject) => {
    getSeqta("seqta/student/assessment/list/upcoming", SID, options)
      .then(data => {
        let upcoming = data.payload.map(x => {
          return {
            subject: {
              code: x.code,
              cID: x.metaclassID,
              pID: x.programmeID,
              name: x.subject
            },
            task: {
              due: x.due ? new Date(x.due).getTime() : undefined,
              availability: x.availability,
              expectations: {
                completed: x.expectationsCompleted,
                enabled: x.expectationsEnabled
              },
              graded: x.graded,
              hasFeedback: x.hasFeedback,
              id: x.id,
              name: x.title,
              status: x.status,
              results: x.results
            }
          };
        });
        resolve(upcoming);
      })
      .catch(err => {
        reject(
          new Error("Failed to load upcoming tasks from SEQTA", {cause: err}),
        );
      });
  });
}

function getPast(SID, programme, metaclass) {
  return new Promise((resolve, reject) => {
    getSeqta("seqta/student/assessment/list/past", SID, {
      programme: programme,
      metaclass: metaclass
    })
      .then(data => {
        let past = [].concat(
          data.payload.pending || [],
          data.payload.feedback || [],
          data.payload.tasks || []
        );
        past = past.map(x => {
          return {
            subject: {
              code: x.code,
              cID: x.metaclassID,
              pID: x.programmeID,
              name: x.subject
            },
            task: {
              due: x.due ? new Date(x.due).getTime() : undefined,
              availability: x.availability,
              expectations: {
                completed: x.expectationsCompleted,
                enabled: x.expectationsEnabled
              },
              graded: x.graded,
              hasFeedback: x.hasFeedback,
              id: x.id,
              name: x.title,
              status: x.status,
              results: x.results,
            }
          };
        });
        resolve(past);
      })
      .catch(err => {
        reject(
          new Error("Failed to load past tasks from SEQTA", {cause: err}),
        );
      });
  });
}

function getTask(SID, metaclass, task) {
  return new Promise((resolve, reject) => {
    getSeqta("seqta/student/assessment/get", SID, {
      assessment: task,
      metaclass: metaclass
    })
      .then(data => {
        let x = data.payload;
        let comment = (x.engagement || {}).feedbackComment || null;
        let criteria = (x.criteria || []).map(y => {
          if (!y) y= {};
          return {
            results: y.results,
            rubric: (y.rubric || {}).lines,
            rubricScore: y.rubricScore,
            description: y.description
          }
        })
        let task = {
          checklist: x.checklist,
          description: sanitizeHtml(x.description, sanitizeOptions),
          criteria: criteria,
          comment: sanitizeHtml(comment, sanitizeOptions),
          marked: x.marked
        }
        resolve(task);
      })
      .catch(err => {
        reject(
          new Error("Failed to load specific task details from SEQTA", {cause: err}),
        );
      });
  });
}

function getLessons(SID, programme, metaclass) {
  return new Promise((resolve, reject) => {
    getSeqta("seqta/student/load/courses", SID, {
      programme: programme,
      metaclass: metaclass
    })
    .then(response => {
      let data = response.payload;
      let weeks = data.d;
      let content = data.w;
      let combinedLessonContent = [];
      weeks.forEach(week => {
        let weekContent = content[week.n] || [];
        let weekData = {
          term: week.t,
          week: week.w,
          index: week.n,
          lessons: week.l.map(lesson => {
            return {
              module: lesson.p,
              startTime: lesson.s,
              endTime: lesson.e,
              date: parseSeqtaDate(lesson.d),
              startUnixTime: parseSeqtaDateTime(lesson.d, lesson.s).getTime(),
              content: {}
            }
          })
        };
        weekContent.forEach(lessonContent => {
          if (!weekData.lessons[lessonContent.n]) {
            if (lessonContent.t) throw new Error("Meaningful content could not be mapped to a lesson");
            return;
          }
          weekData.lessons[lessonContent.n].content = {
            title: lessonContent.t,
            description: sanitizeHtml(lessonContent.o, sanitizeOptions),
            homework: lessonContent.h,
            // i: lessonContent.i
          };
        });
        for (let i=0; i<weekData.lessons.length-1; i++) {
          let firstLesson = weekData.lessons[i];
          let secondLesson = weekData.lessons[i+1];
          let contentEqual = (
            firstLesson.content.title === secondLesson.content.title &&
            firstLesson.content.homework === secondLesson.content.homework &&
            firstLesson.content.description === secondLesson.content.description
          );
          let secondLessonEmpty = (
            !secondLesson.content.title &&
            !secondLesson.content.homework &&
            !secondLesson.content.description
          );
          if (
            firstLesson.endTime === secondLesson.startTime &&
            firstLesson.date.getTime() === secondLesson.date.getTime() &&
            (secondLessonEmpty || contentEqual)
          ) {
            weekData.lessons[i].endTime = secondLesson.endTime;
            weekData.lessons.splice(i+1, 1);
          }
        }
        weekData.lessons = weekData.lessons.sort((a,b) => {return a.startUnixTime - b.startUnixTime});
        combinedLessonContent.push(weekData);
      });
      combinedLessonContent = combinedLessonContent.sort((a, b) => {return a.index - b.index});
      resolve(combinedLessonContent);
    })
    .catch(err => {
      reject(
        new Error("Failed to load lessons from SEQTA", {cause: err}),
      );
    });
  });
}

/**
 * GET the registered name and email from SEQTA.
 * @param {string} SID
 * @returns {Object}
 */
function getUserDetails(SID) {
  return new Promise((resolve, reject) => {
    if (typeof SID !== "string" || SID.length < 30 || SID.length > 50 || !sidRegex.test(SID)) return resolve({
      exists: false
    });
    getSeqta("seqta/student/login", SID)
      .then(data => {
        let payload = data.payload;
        if (!payload || !payload.userCode) return resolve({
          exists: false
        });
        resolve({
          name: payload.userDesc,
          email: payload.email,
          nameCode: payload.userName,
          uid: payload.userCode,
          sid: SID,
          exists: true
        });
      })
      .catch(err => {
        reject(
          new Error("Failed to get user details from SEQTA", {cause: err}),
        );
      });
  });
}

function clearSID(res) {
  res.clearCookie("sid", {
    httpOnly: true,
    sameSite: "Lax",
    secure: true
  });
}

function getTimetable(SID, startDate, endDate) {
  return new Promise((resolve, reject) => {
    if (typeof startDate !== "string" || startDate.length > 20) return reject(
      new Error("No startDate provided to getTimetable"),
    );
    if (typeof endDate !== "string" || endDate.length > 20) return reject(
      new Error("No endDate provided to getTimetable"),
    );
    getSeqta("seqta/student/load/timetable", SID, {
      from: startDate,
      until: endDate,
    })
    .then(data => {
      let timetable = data.payload;
      resolve(timetable);
    })
    .catch(err => {
      reject(
        new Error("Failed to load timetable from SEQTA", {cause: err}),
      );
    });
  });
}

//frontend API
app.post("/internal-api/check-SID", jsonParser, function (req, res) {
  getUserDetails(req.body.sid || null)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.error(new Error(`${req.method} ${req.path} failed.`), {cause: err});
      res.sendStatus(500);
    });
});

app.post("/internal-api/set-SID-cookie", jsonParser, function (req, res) {
  let sid = req.body.sid;
  getUserDetails(sid)
    .then(data => {
      if (!data.exists) return res.send({exists: false})
      res.cookie(
        "sid",
        data.sid,
        {
          //expire in 365 days
          expires: new Date(Date.now() + 86400000*365),
          httpOnly: true,
          sameSite: "Lax",
          secure: true
        }
      );
      res.send({
        exists: true
      });
    })
    .catch(err => {
      console.error(new Error(`${req.method} ${req.path} failed.`), {cause: err});
      res.sendStatus(500);
    });
});

app.post("/internal-api/subjects", jsonParser, function (req, res) {
  let yearID = req.body.yearID || undefined;
  if (yearID && typeof yearID !== "number") {
    return res.sendStatus(400);
  }
  getSubjects(req.cookies.sid, yearID)
  .then(subjects => {
    res.send(subjects);
  })
  .catch(err => {
    console.error(new Error(`${req.method} ${req.path} failed.`), {cause: err});
    res.sendStatus(500);
  });
});

app.post("/internal-api/years", function (req, res) {
  getYears(req.cookies.sid)
    .then(years => {
      res.send(years);
    })
    .catch(err => {
      console.error(new Error(`${req.method} ${req.path} failed.`), {cause: err});
      res.sendStatus(500);
    });
});

app.post("/internal-api/upcoming", function (req, res) {
  getUpcoming(req.cookies.sid)
    .then(upcoming => {
      res.send(upcoming);
    })
    .catch(err => {
      console.error(new Error(`${req.method} ${req.path} failed.`), {cause: err});
      res.sendStatus(500);
    });
});

app.post("/internal-api/task", jsonParser, function (req, res) {
  if (!req.body || !req.body.classID || req.body.classID.length > 20) {
    return res.sendStatus(400);
  }
  if (!req.body.taskID || req.body.taskID.length > 20) {
    return res.sendStatus(400);
  }
  getTask(req.cookies.sid, req.body.classID, req.body.taskID)
    .then(task => {
      res.send(task);
    })
    .catch(err => {
      console.error(new Error(`${req.method} ${req.path} failed.`), {cause: err});
      res.sendStatus(500);
    });
});

app.post("/internal-api/lessons", jsonParser, function (req, res) {
  if (!req.body || !req.body.classID || req.body.classID.length > 20 || typeof req.body.classID !== "string") {
    return res.sendStatus(400);
  }
  getLessons(
    req.cookies.sid,
    parseInt(req.body.classID.slice(0, 4)),
    parseInt(req.body.classID.slice(4)),
  )
  .then(data => res.send(data))
  .catch(err => {
    console.error(new Error(`${req.method} ${req.path} failed.`), {cause: err});
    return res.sendStatus(500);
  });
});

app.post("/internal-api/class-tasks", jsonParser, function (req, res) {
  if (!req.body || !req.body.classID || req.body.classID.length > 20 || typeof req.body.classID !== "string") {
    return res.sendStatus(400);
  }
  let taskList = [];
  getPast(
    req.cookies.sid,
    parseInt(req.body.classID.slice(0, 4)),
    parseInt(req.body.classID.slice(4)),
  )
  .then(tasks => taskList = taskList.concat(tasks || []))
  .then(() => getUpcoming(
    req.cookies.sid,
    parseInt(req.body.classID.slice(0, 4)),
    parseInt(req.body.classID.slice(4)),
  ))
  .then(tasks => taskList = taskList.concat(tasks || []))
  .then(() => res.send(taskList))
  .catch(err => {
    console.error(new Error(`${req.method} ${req.path} failed.`), {cause: err});
    return res.sendStatus(500);
  });
});

app.post("/internal-api/send-feedback", bodyParser.raw({inflate: true, limit: '5mb', type: '*/*'}), async function (req, res) {
  let description = req.query.description;
  let contactConsent = req.query.contactConsent;
  let rawData = req.body
  if (!description || !Buffer.isBuffer(rawData)) return res.sendStatus(400);

  let id = crypto.randomUUID();
  let date = new Date().toLocaleDateString("en-AU").replaceAll("/", "-");
  if (rawData.length) fs.writeFile(path.join(__dirname, `/out/screenshot-${id}-${date}.png`), rawData, function(){});
  let details = Buffer.from(JSON.stringify({
    description: description,
    contactConsent: contactConsent
  }));
  fs.writeFile(path.join(__dirname, `/out/log-${id}-${date}.txt`), details, function(){});
  res.sendStatus(200);
});

app.post("/internal-api/timetable", jsonParser, function (req, res) {
  let startDate = req.body.startDate, endDate = req.body.endDate;
  if (!startDate || startDate.length > 20 || typeof startDate !== "string") return res.sendStatus(400);
  if (!endDate || endDate.length > 20 || typeof endDate !== "string") return res.sendStatus(400);
  getTimetable(req.cookies.sid, startDate, endDate)
    .then(task => {
      res.send(task);
    })
    .catch(err => {
      console.error(new Error(`${req.method} ${req.path} failed.`), {cause: err});
      res.sendStatus(500);
    });
});

//frontend
//configure static files
app.use("/assets", express.static("public"));

app.get("/download-app", function(req, res) {
  res.download(path.join(__dirname, "/private/SID-app.exe"));
});

const launchTime = 1714519800000;
app.get("/signin", function (req, res) {
  if (new Date().getTime() < launchTime) return res.redirect("/");
  getUserDetails(req.cookies.sid)
    .then(data => {
      if (data.exists) return res.redirect("/app/dashboard");
      res.sendFile(path.join(__dirname, "/html/signin.html"));
    })
    .catch(err => {
      console.error(new Error(`${req.method} ${req.path} failed.`), {cause: err});
      res.sendStatus(500);
    });
});

app.get("/app/class/:classID/:className?", function (req, res) {
  if (!req.params.classID || req.params.classID.length > 20 || typeof req.params.classID !== "string") res.sendStatus(400);
  getSubject(req.cookies.sid, req.params.classID)
    .then(data => {
      if (!data) {
        return res.sendStatus(400);
      }
      if (data.code !== req.params.className) {
        return res.redirect("/app/class/" + data.programme + data.metaclass + "/" + data.code);
      }
      ejs.renderFile(
        path.join(__dirname, "/private/class.ejs"), 
        {
          className: data.title
        }, 
        {
          async: true,
      })
      .then(str => {
        res.status(200).send(str);
      })
      .catch(err => {
        console.error(new Error(`${req.method} /app/class/***/*** failed.`), {cause: err});
        res.sendStatus(500);
      });
    })
    .catch(err => {
      console.error(new Error(`${req.method} /app/class/***/*** failed.`), {cause: err});
      res.redirect("/signin");
    });
});

app.get("/app/dashboard", function (req, res) {
  getUserDetails(req.cookies.sid)
    .then(data => {
      if (!data.exists) return res.redirect("/signin");
      res.sendFile(path.join(__dirname, "/private/dashboard.html"));
    })
    .catch(err => {
      console.error(new Error(`${req.method} ${req.path} failed.`), {cause: err});
      res.sendStatus(500);
    });
});

app.get("/app/timetable", function (req, res) {
  getUserDetails(req.cookies.sid)
    .then(data => {
      if (!data.exists) return res.redirect("/signin");
      res.sendFile(path.join(__dirname, "/private/timetable.html"));
    })
    .catch(err => {
      console.error(new Error(`${req.method} ${req.path} failed.`), {cause: err});
      res.sendStatus(500);
    });
});

app.get("/app/*?", function (req, res) {
  res.redirect("/app/dashboard");
});

app.get("/terms", function (req, res) {
  res.redirect("/privacy");
});

app.get("/privacy", function (req, res) {
  res.sendFile(path.join(__dirname, "/html/privacy.html"));
});

app.get("/app", function (req, res) {
  res.redirect("/app/dashboard");
});

app.get("/", function (req, res) {
  if (new Date().getTime() < launchTime) return res.sendFile(path.join(__dirname, "/private/countdown.html"))
  res.sendFile(path.join(__dirname, "/private/index.html"));
});

app.get("/*", function (req, res) {
  res.status(404);
  res.sendFile(path.join(__dirname, "/private/404.html"));
});

http.listen(8080, "0.0.0.0", function () {
  console.log("Running on port 8080");
});

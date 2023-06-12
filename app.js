const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

let noClasses = "";
let noStudents = "";
let currentClass = "";

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('strictQuery', true);

mongoose.connect("mongodb://127.0.0.1:27017/teachersAideDB");

const ActionsSchema = {
    name: String,
    count: Number
};

const Action = mongoose.model("Action", ActionsSchema);

const StudentsSchema = {
    name: String,
    actions: [ActionsSchema]
};

const Student = mongoose.model("Student", StudentsSchema);

const ClassroomSchema = {
    name: String,
    students: [StudentsSchema]
};

const Classroom = mongoose.model("Classroom", ClassroomSchema);

// app.get("/", function(req, res){

//     res.render("login");

// });


app.get("/", function(req, res){

    Classroom.find({}, function(err, foundClassrooms){

        if(foundClassrooms.length === 0){
            noClasses = "You have not added any classes yet.";
        } else {
            noClasses = "";
        }
        res.render("classlist", {classItems: foundClassrooms, noClasses: noClasses});

    });

})
app.post("/", function(req, res){

    let itemName = req.body.newClassItem;

    const classroom = new Classroom({
        name: itemName,
        students: []
    });

    classroom.save();
    setTimeout(() => {
        res.redirect("/");
      }, "100")
    

})

app.get("/classes/:className", function(req, res){


   const requestedClass = _.capitalize(req.params.className);

    Classroom.findOne({name: requestedClass}, function(err, foundClassroom){

        if(err){
            console.log(err, "Failed finding students.");
        } else {

            if (foundClassroom.students.length === 0){
                noStudents = "You have not added any students to this class yet."; 
            } else {
                noStudents = "";
            }

            res.render("studentlist", {classTitle: requestedClass, studentNames: foundClassroom.students, noStudents: noStudents});

        }
    });

})
app.post("/studentlist", function(req, res){

    let name = req.body.newStudent;
    let classTitle = req.body.classTitle;

    const student = new Student({
        name: name,
        actions: [
            {name: "Rose Hand", count: '0'},
            {name: "Participated", count: '0'},
            {name: "Volunteered", count: '0'},
            {name: "Detention", count: '0'},
            {name: "Interrupted", count: '0'},
            {name: "Passed Notes", count: '0'}
        ]
    });

    Classroom.findOne({name: classTitle}, function(err, foundClassroom){
        foundClassroom.students.push(student);
        foundClassroom.save();
    });


    setTimeout(() => {
        res.redirect("/classes/" + classTitle);
      }, "100")

})

app.get("/classes/:className/:studentName", function(req, res){

    const requestedClass = _.capitalize(req.params.className);
    const studentName = req.params.studentName;
    // const trimmedLinkName = _.trim(linkName, " ");
 
    Classroom.findOne({name: requestedClass}, function(err, foundClass){
 
        if(err){
             console.log(err, "Failed finding classroom.");
        } else {
            const students = foundClass.students;
            students.forEach(student => {
                if(student.name === studentName){
                    res.render("studentinfo", {classTitle: requestedClass, studentName: studentName, studentActions: student.actions});
                }
            });
        }
    });
})
app.post("/classes/:className/:studentName", function(req, res){

    const chosenAction = req.body.chosenAction;
    const studentName = req.body.studentName;
    const classTitle = req.body.classTitle;

    Classroom.findOne({name: classTitle}, function(err, foundClass){
        if(err){
             console.log(err, "Failed finding classroom.");
        } else {
            const students = foundClass.students;
            students.forEach(student => {
                if(student.name === studentName){
                    const actions = student.actions;
                    actions.forEach(action => { 
                        if(action.name === chosenAction){
                            action.count++;
                            foundClass.save();
                        }
                    });
                    setTimeout(() => {
                        res.redirect(`/classes/${classTitle}/${studentName}`);
                      }, "100")
                }
            });
        }
    });

})
app.post("/newAction", function(req, res){
    const actionInput = req.body.newAction;
    const studentName = req.body.studentName;
    const classTitle = req.body.classTitle;

    const newAction = new Action ({
        name: actionInput,
        count: '0'
    });

    Classroom.findOne({name: classTitle}, function(err, foundClass){
        if(err){
             console.log(err, "Failed finding classroom.");
        } else {
            const students = foundClass.students;
            students.forEach(student => {
                if(student.name === studentName){
                    const actions = student.actions;
                    actions.push(newAction);
                    foundClass.save();
                    setTimeout(() => {
                        res.redirect(`/classes/${classTitle}/${studentName}`);
                      }, "100")
                }
            });
        }
    });
});

app.get("/login", function(req, res){
    res.render("login");
})
app.post("/loginAttempt", function(req, res){
    const loginEmail = req.body.loginEmail;
    const loginPassword = req.body.loginPassword;

    if(loginEmail === "alex@portfolio.com" && loginPassword === "AlexPortfolioItem"){
        res.redirect("/");
    }
    else { res.redirect("/login") }
})


app.listen(3000, function() {
    console.log("Server started on port 3000");
})
  
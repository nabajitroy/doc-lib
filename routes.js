const routes = require("express").Router();
let Todo = require("./todo.model");

const officegen = require("officegen");
const fs = require("fs");

//upload requirement
var path = require("path");
var BoxSDK = require("box-node-sdk");
var sdk = new BoxSDK({
  clientID: "q98jrbjrwsyuhic1jexq943kmowvsrdt",
  clientSecret: ""
});

var client = sdk.getBasicClient("D9iZ6OVDf9bnzbb6ffRxVApIYt0eda8P");

routes.get("/", (req, res) => {
  Todo.find((err, todos) => {
    if (err) {
      console.log(err);
    } else {
      res.json(todos);
    }
  });
});

routes.get("/:id", (req, res) => {
  let id = req.params.id;
  //console.log("Here is id" + id);
  Todo.findById(id, (err, todo) => {
    if (err) {
      console.log(err);
    } else {
      res.json(todo);
    }
  });
});

routes.post("/", (req, res) => {
  let todo = new Todo(req.body);
  let file_name = req.body.todo_description.split(" ").join("_") + ".docx";
  // console.log(file_name);

  //Create Cocument starts
  // Create an empty Word object:
  let docx = officegen("docx");

  // Officegen calling this function after finishing to generate the docx document:
  docx.on("finalize", function(written) {
    console.log("Finish to create a Microsoft Word document.");
  });

  // Officegen calling this function to report errors:
  docx.on("error", function(err) {
    console.log(err);
  });

  // Create a new paragraph:
  let pObj = docx.createP();
  var header = docx.getHeader().createP({ align: "left" });
  header.addImage("rsz_rotzler-logo.jpg");

  pObj = docx.createP();

  pObj.addText("This is a demo of ", { font_face: "Arial", font_size: 20 });
  pObj.addText(req.body.todo_docgroup + " Templete ", {
    font_face: "Arial",
    font_size: 20,
    color: "00ffff"
  });

  pObj = docx.createP();

  // Let's generate the Word document into a file:

  let out = fs.createWriteStream("documents/" + file_name);

  out.on("error", function(err) {
    console.log(err);
  });

  out.on("finish", function() {
    console.log("Stream opened, will start writing in 2 secs");
    var readerStream = fs.createReadStream("documents/" + file_name);
    client.files.uploadFile("97544947238", file_name, readerStream, function(
      err,
      file
    ) {
      if (err) {
        console.log("err: " + err);
      } else {
        let obj = file.entries[0].id;
        console.log(typeof file);
        console.log("file uploaded: " + JSON.stringify(obj));

        todo.todo_doc_id = obj;
        todo
          .save()
          .then(todo => {
            res.status(200).json({ todo: todo });
          })

          .catch(err => {
            res.status(400).json({ todo: "Unable to save todo" });
          });
      }
    });
  });

  docx.generate(out);

  // Async call to generate the output file:

  //Create Cocument ends and upload starts

  //console.log(stream);

  //readable
});

routes.put("/:id", (req, res) => {
  Todo.findById(req.params.id, (err, todo) => {
    if (!todo) res.status(404).send("No todo item found");
    else {
      todo.todo_description = req.body.todo_description;
      todo.todo_responsible = req.body.todo_responsible;
      todo.todo_responsible = req.body.todo_responsible;
    }
    todo
      .save()
      .then(todo => {
        console.log("Hello");
        res.status(200).send("Todo updated successfully");
      })
      .catch(err => {
        res.status(401).send("Unable to update todo");
      });
  });
});

routes.delete("/:id", (req, res) => {
  console.log(req.params);
  Todo.findById(req.params.id, (err, todo) => {
    if (todo) {
      client.files.deletePermanently(todo.todo_doc_id).then(() => {
        console.log("file deleted " + todo.todo_doc_id);
      });
      Todo.remove({ _id: req.params.id }, err => {
        if (!err) res.status(200).send("Todo removed successfully");
        else {
          res.status(401).send("Error removing todo ");
        }
      });
    } else {
      res.status(404).send("Todo record not found ");
    }
  });
});

module.exports = routes;

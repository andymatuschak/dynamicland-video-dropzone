#!/usr/bin/node

const express = require("express");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const path = require("path");
const sanitize = require("sanitize-filename");
const app = express();
const argv = require('optimist')
    .usage('Webserver for Dynamicland video upload service.')
    .demand(['p','o'])
    .alias('p', 'port')
    .alias('o', 'output')
    .describe('p', 'The port on which the webserver should listen')
    .describe('o', "The path where uploaded videos should be written")
    .argv

const basePath = argv.output;

app.use(express.static("public"));
app.use(
  fileUpload({
    limits: { fileSize: 100 * 1024 * 1024 } // 100 MB limit for now.
  })
);

app.post("/upload", function(req, res) {
  if (!req.files) return res.status(400).send("No files were uploaded.");

  // Sanitize the name
  let inputName = req.body.inputName;
  inputName = inputName.replace(/ /g, "-");
  inputName = sanitize(inputName);
  if (!inputName) {
    inputName = "untitled";
  }

  // Find an unused filename
  let candidatePath = path.join(basePath, `${inputName}.mp4`);
  let counter = 2;
  while (true) {
    try {
      fs.accessSync(candidatePath);
      candidatePath = path.join(basePath, `${inputName}-${counter}.mp4`);
      counter += 1;
    } catch (e) {
      break;
    }
  }

  const sampleFile = req.files.video;
  sampleFile.mv(candidatePath, function(err) {
    if (err) return res.status(500).send(err);

    res.sendFile("public/uploaded.html", {root: "."});
  });
});

const port = argv.port;
app.listen(port, () => console.log(`Listening on port ${port}!`));

import fs from "fs";

//This function fetches a directory from the location

export const fetchDir = (dir, baseDir) => {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, { withFileTypes: true }, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(
          files.map((file) => ({
            type: file.isDirectory() ? "dir" : "file",
            name: file.name,
            path: `${baseDir}/${file.name}`,
          }))
        );
      }
    });
  });
};

//This function returns the contents of a perticular file

export const fetchFileContents = (file) => {
  return new Promise((resolve, reject) => {
    fs.readFile(file, "utf-8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

//Save file and it's contents

export const saveFile = async (file, content) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, content, "utf-8", (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

const fs = require('fs');
const path = require('path');

const dir = 'd:/Proyectos/CanchAPP/FllutterApp/lib';
const find = 'https://back-canchapp.onrender.com';
const replace = 'http://192.168.101.36:3000';

function walk(directory) {
  let results = [];
  const list = fs.readdirSync(directory);
  list.forEach(file => {
    file = directory + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.dart')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(dir);
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(find)) {
    content = content.split(find).join(replace);
    fs.writeFileSync(file, content);
    console.log('Replaced in ' + file);
  }
});

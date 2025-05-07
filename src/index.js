//const http = require('http');
//const lt = require('./latex-trs');
//const name = "result";
//
////http.createServer(function (req, res) {
////  res.writeHead(200, {'Content-Type': 'text/html'});
////  res.end('Hello World!');
////}).listen(8080); 
//
//
//async function main() {
//    lt.sHello();
//    await lt.save(name);
//    await lt.compile(name);
//    await lt.clean(name);
//
//}
//main()


// Import Express
const express = require('express');
const app = express();

// Define a route
app.get('/', (req, res) => {
    res.send('Welcome to the Express.js Tutorial');
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

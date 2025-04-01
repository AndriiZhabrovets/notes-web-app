const http = require('http');
const lt = require('./latex-trs');
const name = "result";

//http.createServer(function (req, res) {
//  res.writeHead(200, {'Content-Type': 'text/html'});
//  res.end('Hello World!');
//}).listen(8080); 


async function main() {
    lt.sHello();
    await lt.save(name);
    await lt.compile(name);
    await lt.clean(name);

}
main()

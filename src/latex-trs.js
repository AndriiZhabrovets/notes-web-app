const fs = require("fs");
const {exec}= require("child_process");


const temp = "\nHello World!\n\\end{document}";

exports.sHello = function () {
    console.log("Hello World!");
};

exports.save = function(name) {
    let template = fs.readFileSync('latex-temp.tex');
    let res = template+temp;
    fs.writeFile(`src/${name}.tex`, res, function (err) {
        if (err) throw err;
        console.log("Saved!");
    })

}

exports.compile = function(filename) {
    exec(`pdflatex -output-directory=src/latex-res src/${filename}`, (error) => {

        if(error){
            console.log(error);
            return;
        }
        console.log("Compiled!");
    }); 
}

exports.clean = function(filename) {
    fs.unlinkSync(`src/latex-res/${filename}.log`, (err) => err && console.error(err));
    fs.unlinkSync(`src/latex-res/${filename}.aux`, (err) => err && console.error(err));
    console.log("Done!");
}

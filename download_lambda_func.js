"use strict";

const shell = require("shelljs");
const fs = require("fs");
var AdmZip = require("adm-zip");

const args = process.argv;
if (args[2] == undefined) {
	console.error("No directory specified. You must specify a directory to download the functions to using 'node download_functions.js <directory>'");
	process.exit(1);
}
const directory = args[2];

console.log(`Listing functions ...`);
let data = shell.exec("aws lambda list-functions | grep FunctionName", { silent: true });
let ar = data.stdout.split("\n");
let funcList = [];
console.log(`Found ${ar.length - 1} functions. Starting download...`);
for (let i = 0; i < ar.length - 1; i++) {
	let t = ar[i].split(":");
	let func = t[1].replace('"', "").replace('"', "").replace(",", "").trim();
	funcList.push(func);
}
if (!fs.existsSync(directory)) {
	fs.mkdirSync(directory);
} else {
	shell.exec(`rm -rf ${directory}/*`);
}

for (let i = 0; i < funcList.length; i++) {
	let cmdGetFunc = `aws lambda get-function --function-name "${funcList[i]}"`;
	let funcData = JSON.parse(shell.exec(cmdGetFunc, { silent: true }));
	console.log(`Downloading function ${funcList[i]} ${i + 1} / ${funcList.length}...`);
	let cmdWget = `curl -o ${directory}/${funcList[i]}_lambda.zip "${funcData.Code.Location}"`;
	shell.exec(cmdWget, { silent: true });
}

fs.readdirSync(directory).forEach((file) => {
	if (file.indexOf(".zip") != -1) {
		var zip = new AdmZip(`${directory}/${file}`);
		let functionName = file.split(".")[0];
		console.log(`Extracting function ${functionName}...`);
		try {
			zip.extractEntryTo(`index.js`, `${directory}/`, false, true, false, `${functionName}.js`);
		} catch (error) {
			console.log(error);
		}
		fs.rmSync(`${directory}/${file}`);
	}
});

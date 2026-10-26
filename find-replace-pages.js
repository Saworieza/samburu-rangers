#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const projectRoot = __dirname;
const excludedDirectories = new Set(['.git', 'node_modules']);

function showUsage() {
	console.log(`Usage:
  node find-replace-pages.js [--apply] <find text> <replace text>

By default, previews exact matches in every .html file under this directory.
Pass --apply to write the replacements. Quote arguments containing spaces.`);
}

function collectHtmlFiles(directory) {
	const files = [];

	for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
		const entryPath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			if (!excludedDirectories.has(entry.name)) {
				files.push(...collectHtmlFiles(entryPath));
			}
		} else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
			files.push(entryPath);
		}
	}

	return files;
}

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
	showUsage();
	process.exit(0);
}

const applyChanges = args[0] === '--apply';
if (applyChanges) args.shift();

if (args.length !== 2 || args[0].length === 0) {
	showUsage();
	process.exit(1);
}

const [findText, replaceText] = args;
let totalMatches = 0;
let changedFiles = 0;

for (const filePath of collectHtmlFiles(projectRoot)) {
	const content = fs.readFileSync(filePath, 'utf8');
	const matchCount = content.split(findText).length - 1;
	if (matchCount === 0) continue;

	totalMatches += matchCount;
	changedFiles += 1;
	console.log(`${path.relative(projectRoot, filePath)}: ${matchCount} match${matchCount === 1 ? '' : 'es'}`);

	if (applyChanges) {
		fs.writeFileSync(filePath, content.split(findText).join(replaceText));
	}
}

if (totalMatches === 0) {
	console.log('No matches found.');
} else if (applyChanges) {
	console.log(`Replaced ${totalMatches} occurrence${totalMatches === 1 ? '' : 's'} in ${changedFiles} file${changedFiles === 1 ? '' : 's'}.`);
} else {
	console.log(`Preview: ${totalMatches} occurrence${totalMatches === 1 ? '' : 's'} in ${changedFiles} file${changedFiles === 1 ? '' : 's'}. Run again with --apply to write changes.`);
}
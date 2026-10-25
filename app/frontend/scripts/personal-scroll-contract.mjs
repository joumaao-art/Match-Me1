import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import ts from 'typescript';
const read = path => fs.readFileSync(path, 'utf8');
const baseline = JSON.parse(read('scripts/artifacts/personal-scroll-baseline.json'));
const form = read('src/components/seeker/PersonalInformation.tsx');
const account = read('src/components/seeker/MobileProfileAccount.tsx');
const shell = read('src/pages/JobSeeker.tsx');
let count = 0;
const results = [];
function test(name, check) { check(); count++; results.push(name); console.log(`PASS ${name}`); }
for (const [path, hash] of Object.entries(baseline.hashes)) test(`preserved ${path}`, () => assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex'), hash));
test('entire form unchanged except mobile layout classes', () => {
 const restored = form.replace("className={mobile ? 'space-y-7 h-auto min-h-0 flex-none' : 'space-y-7'} noValidate", 'className="space-y-7" noValidate').replace("mobile ? 'py-3 bg-background' : 'pt-2'", "mobile ? 'sticky bottom-0 py-3 bg-background' : 'pt-2'");
 assert.equal(restored, baseline.form);
});
test('canonical Save and validation exactly preserved', () => assert.equal(form.slice(form.indexOf('  const save = async'), form.indexOf('  const age =')), baseline.save));
test('desktop Personal content exactly preserved', () => assert.equal(form.slice(form.indexOf('export function PersonalInformationPage')), baseline.desktop));
for (const category of ['identity','contact','compensation','gender']) test(`${category} fields and spacing preserved`, () => {
 const pattern = new RegExp(`<fieldset className="space-y-4" data-personal-category="${category}"[\\s\\S]*?</fieldset>`);
 assert.equal(form.match(pattern)?.[0], baseline.form.match(pattern)?.[0]);
});
test('mobile form content-driven, not viewport-sized', () => assert.ok(form.includes("mobile ? 'space-y-7 h-auto min-h-0 flex-none' : 'space-y-7'")));
test('Save in normal flow, no sticky/fixed visual displacement', () => {
 assert.ok(form.includes("mobile ? 'py-3 bg-background' : 'pt-2'"));
 assert.ok(!form.slice(0, form.indexOf('export function PersonalInformationPage')).includes('sticky'));
});
test('Save still last form element', () => assert.match(form, /<Button type="submit"[\s\S]*?<\/Button><\/div>\s*<\/form>/));
test('Personal scroller keeps min-height zero and normal overflow', () => assert.ok(account.includes("section==='personal' ? 'flex-1 min-h-0 overflow-y-auto overscroll-y-contain bg-background' : 'flex-1 min-h-0 overflow-y-auto bg-background'")));
test('Personal parent can shrink without changing desktop classes', () => assert.ok(shell.includes("${isMobile && activeTab==='personal' ? ' min-h-0' : ''}")));
test('one existing shell bottom-nav clearance', () => assert.equal((shell.match(/pb-\[calc\(4rem\+env\(safe-area-inset-bottom,0px\)\)\]/g) || []).length, 1));
test('no duplicated clearance or viewport height in mobile form', () => {
 const mobileForm = form.slice(0, form.indexOf('export function PersonalInformationPage'));
 assert.doesNotMatch(mobileForm, /(?:100d?vh|pb-28|env\(safe-area|overflow-y-auto|overflow-hidden|justify-between)/);
});
test('content wrapper ends with existing 16px bottom padding only', () => assert.ok(account.includes('<div className="px-5 py-4 max-w-lg mx-auto w-full">')));
test('no categories independently made scrollable', () => {
 for (const category of ['identity','contact','compensation','gender']) assert.ok(form.includes(`className="space-y-4" data-personal-category="${category}"`));
});
test('no added scroll-hiding workaround on Personal boundary', () => {
 assert.ok(shell.includes('<div className="h-[100dvh] bg-background flex overflow-hidden">'));
 assert.doesNotMatch(shell.slice(shell.indexOf('{/* Main content area')), /<main[^>]*overflow-hidden/);
 assert.doesNotMatch(account, /overflow-hidden/);
});
for (const path of ['src/components/seeker/PersonalInformation.tsx','src/components/seeker/MobileProfileAccount.tsx','src/pages/JobSeeker.tsx']) test(`TSX syntax ${path}`, () => {
 const source = ts.createSourceFile(path, read(path), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
 assert.equal(source.parseDiagnostics.length, 0);
});
fs.writeFileSync('scripts/artifacts/personal-scroll-results.json', JSON.stringify({count,results,evidence:'Source/AST contracts only. No pixel measurements, authenticated viewer, keyboard or genuine touch acceptance established.'},null,2));
console.log(`${count} Personal scrolling source contracts passed.`);

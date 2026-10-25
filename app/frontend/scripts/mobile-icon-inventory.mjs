import fs from 'node:fs';
import crypto from 'node:crypto';
import ts from 'typescript';
const files = [
 'src/pages/Index.tsx','src/pages/Auth.tsx','src/pages/ResetPassword.tsx','src/pages/MobileOnboarding.tsx','src/pages/JobSeeker.tsx','src/pages/Messages.tsx','src/pages/Notifications.tsx',
 ...['MobileSwipePage','MobileSwipeCard','MobileSwipePreferences','MobileProfileAccount','MobileProfileLogout','MobileSupport','MobileSkills','PersonalInformation','ProfessionalProfile','MobileConfirmedDate','CreditsPopup','ViaPremiumPage','SeekerAppearance','MandatoryProfileGuidance','SeekerCreditPanel'].map(n=>`src/components/seeker/${n}.tsx`),
 ...['MobileDashboard','MobileBottomNav','BackButton','ProfileFields','PreferenceSelectors','PhoneInput','ChangePassword','BottomSheet','CandidateDiscoverability','SeekerInvitations','DecisionActionBar','CardEngine','SwipeFeedbackEngine'].map(n=>`src/components/shared/${n}.tsx`),
 ...['MobileEntry','MobileControls','OnboardingKit'].map(n=>`src/components/onboarding/${n}.tsx`),
 ...['dialog','alert-dialog','select','dropdown-menu','calendar','drawer','toast','sonner'].map(n=>`src/components/ui/${n}.tsx`)
];
const inventory=[];
for(const file of files){
 const source=fs.readFileSync(file,'utf8');const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const icons=new Set();
 for(const statement of ast.statements)if(ts.isImportDeclaration(statement)&&statement.moduleSpecifier.text==='lucide-react')for(const el of statement.importClause?.namedBindings?.elements||[])icons.add(el.name.text);
 function visit(node){
  if(ts.isJsxElement(node)){
   const tag=node.openingElement.tagName.getText(ast);
   if(/^(button|Button|.*Trigger|.*Close|.*Scroll.*Button)$/.test(tag)){
    const found=[];function child(n){if(ts.isJsxSelfClosingElement(n)&&icons.has(n.tagName.getText(ast)))found.push(n.tagName.getText(ast));ts.forEachChild(n,child);}node.children.forEach(child);
    if(found.length)inventory.push({file,line:ast.getLineAndCharacterOfPosition(node.getStart(ast)).line+1,tag,icons:[...new Set(found)],opening:node.openingElement.getText(ast),sharedOrLegacy:file.includes('/ui/')||file.includes('JobSeeker.tsx')||file.includes('OnboardingKit')});
   }
  }ts.forEachChild(node,visit);
 }visit(ast);
}
fs.writeFileSync('scripts/artifacts/mobile-icon-inventory.json',JSON.stringify({definition:'Source control templates containing Lucide icons; repeated rows count once. Shared/legacy templates are candidates, not a claimed rendered or reachable total. Dynamic Icon props and native browser glyphs require separate inspection.',files,controls:inventory},null,2));
const protect=['src/services','src/lib','src/stores'];const hashes={};
function hash(file){hashes[file]=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
for(const dir of protect)for(const name of fs.readdirSync(dir))if(fs.statSync(`${dir}/${name}`).isFile())hash(`${dir}/${name}`);
for(const file of ['src/pages/Company.tsx','src/pages/Admin.tsx','src/pages/DesktopSeekerOnboarding.tsx',...fs.readdirSync('src/components/seeker').filter(n=>n.startsWith('Desktop')).map(n=>`src/components/seeker/${n}`),'src/components/shared/MobileBottomNav.tsx','src/components/shared/SwipeFeedbackEngine.tsx','src/components/onboarding/MobileControls.tsx'])hash(file);
fs.writeFileSync('scripts/artifacts/mobile-icon-baseline.json',JSON.stringify(hashes,null,2));
console.log(`Inventoried ${inventory.length} source control templates in ${files.length} files; protected ${Object.keys(hashes).length} source files.`);

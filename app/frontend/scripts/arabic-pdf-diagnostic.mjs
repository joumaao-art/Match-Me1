import {jsPDF} from 'jspdf';
import {readFile,writeFile} from 'node:fs/promises';
const doc=new jsPDF();doc.addFileToVFS('Amiri.ttf',(await readFile('public/fonts/Amiri-Regular.ttf')).toString('base64'));doc.addFont('Amiri.ttf','Amiri','normal');doc.setFont('Amiri');doc.setFontSize(22);
const text='أحمد حسن — يناير ٢٠٢٠';
const options=[{}, {isInputVisual:false,isOutputVisual:true,isInputRtl:true,isOutputRtl:false},{isInputVisual:false,isOutputVisual:true,isInputRtl:false,isOutputRtl:false},{isInputVisual:true,isOutputVisual:true,isInputRtl:false,isOutputRtl:false}];
options.forEach((o,i)=>{doc.text(`Variant ${i+1}`,20,25+i*45);doc.text(i===3?[...doc.processArabic(text)].reverse().join(''):text,190,40+i*45,{align:'right',...o});});await writeFile('scripts/artifacts/arabic-diagnostic.pdf',Buffer.from(doc.output('arraybuffer')));

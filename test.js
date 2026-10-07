const fs = require('fs');
const { generateDraft } = require('./lib/generate');
const { buildDocx } = require('./lib/buildDocx');
(async () => {
  const input = { title: '', problem: 'x', solution: 'y', department: 'Department of Computer Science & Engineering (Data Science)',
    inventors: ['Prof. A B','C D E','F G H','I J K','L M N'].map((n,i)=>({name:n,email:`u${i}@vit.edu`,phone:'9999999999'})) };
  fs.writeFileSync('/tmp/test.docx', await buildDocx(await generateDraft(input), input));
  console.log('ok');
})();

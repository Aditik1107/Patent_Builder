const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType, ImageRun } = require('docx');
const sharp = require('sharp');

async function buildDocx(draft, input) {
  // Helpers
  const justify = (text) => new Paragraph({ text, alignment: AlignmentType.JUSTIFIED, spacing: { after: 200, line: 360 } });
  const boldHeading = (text) => new Paragraph({ children: [new TextRun({ text, bold: true })], spacing: { before: 300, after: 200, line: 360 } });
  
  const preamble = new Paragraph({
    children: [new TextRun({ text: "Following information is required for drafting of patent application.", bold: true })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 }
  });

  // 1. Applicant Table
  const applicantTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [3000, 2000, 5000],
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Full Name", bold: true })], alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nationality", bold: true })], alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Address", bold: true })], alignment: AlignmentType.CENTER })] }),
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Vishwakarma Institute of Technology")] }),
          new TableCell({ children: [new Paragraph({ text: "Indian", alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph("666, Upper Indiranagar, Bibwewadi, Pune, Maharashtra, India – 411 037")] }),
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Vishwakarma University")] }),
          new TableCell({ children: [new Paragraph({ text: "Indian", alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph("Survey No 2, 3, 4, Kondhwa Main Rd, Laxmi Nagar, Betal Nagar, Kondhwa, Pune, Maharashtra, India - 411048")] }),
        ]
      })
    ]
  });

  // 2. Inventors Table
  const invRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Full Name (Including middle name)", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nationality", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "VIT Address (Start with full dept. name followed by full institute name)", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Mail ID", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Phone No.", bold: true })] })] }),
      ]
    })
  ];
  
  input.inventors.forEach(inv => {
    invRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph(inv.name)] }),
        new TableCell({ children: [new Paragraph("IN")] }),
        new TableCell({ children: [new Paragraph(`${input.department}, Vishwakarma Institute of Technology, Pune`)] }),
        new TableCell({ children: [new Paragraph(inv.email || "[Add mail ID]")] }),
        new TableCell({ children: [new Paragraph(inv.phone || "[Add phone]")] }),
      ]
    }));
  });
  const inventorsTable = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: invRows });

  // Signature Table
  const sigInstruction = new Paragraph({ text: "Copy and paste clear soft copy of signatures of all inventors in the following table: (Insert or delete the cells as per number of inventers)", spacing: { before: 240, after: 120 } });
  
  const sigNameCells = input.inventors.map(inv => new TableCell({ children: [new Paragraph(inv.name)], width: { size: 100 / input.inventors.length, type: WidthType.PERCENTAGE } }));
  const sigSpaceCells = input.inventors.map(inv => {
    if (inv.signature) {
      return new TableCell({
        children: [new Paragraph({
          children: [new ImageRun({
            data: Buffer.from(inv.signature.split(',')[1], 'base64'),
            transformation: { width: 100, height: 50 }
          })],
          alignment: AlignmentType.CENTER
        })]
      });
    }
    return new TableCell({ children: [new Paragraph({ text: "[Paste signature here]", alignment: AlignmentType.CENTER })] });
  });
  
  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: sigNameCells }),
      new TableRow({ children: sigSpaceCells })
    ]
  });

  const children = [
    preamble,
    new Paragraph({ text: "1.\tFull name, nationality and address of applicant(s):", heading: HeadingLevel.HEADING_1 }),
    applicantTable,
    new Paragraph({ text: "2.\tFull name (including middle name), nationality, address, mail id, and phone number of inventor(s):", heading: HeadingLevel.HEADING_1 }),
    inventorsTable,
    sigInstruction,
    signatureTable,
    
    new Paragraph({ text: "3. Title of the invention:", heading: HeadingLevel.HEADING_1 }),
    justify(draft.title),
    
    new Paragraph({ text: "4. Technical field of the invention:", heading: HeadingLevel.HEADING_1 }),
    justify(draft.technicalField),
    
    new Paragraph({ text: "5. Prior art:", heading: HeadingLevel.HEADING_1 }),
    ...(draft.priorArt.split('\n').filter(p => p.trim()).map(p => justify(p.trim()))),
    
    new Paragraph({ text: "6. Objective(s) of Invention:", heading: HeadingLevel.HEADING_1 }),
    justify("The primary objectives of the invention are:"),
    ...(draft.objectives.map((obj, i) => new Paragraph({ text: `${i + 1}. ${obj}`, spacing: { after: 200, line: 360 } }))),
    boldHeading("Reason and Advantages Over Existing Technology"),
    justify(draft.advantages),
    
    new Paragraph({ text: "7. Synopsis:", heading: HeadingLevel.HEADING_1 }),
    ...(draft.synopsis.split('\n').filter(p => p.trim()).map(p => justify(p.trim()))),
    
    new Paragraph({ text: "8. Brief description of drawings (if any):", heading: HeadingLevel.HEADING_1 }),
    justify("The accompanying drawings, which are incorporated in and constitute part of this specification, illustrate exemplary embodiments of the invention and, together with the description, serve to explain the principles of the invention. Reference numerals used across the drawings refer to like components. Component-level reference numerals are grouped by hundreds according to the module to which they belong."),
    ...(draft.figures.map(fig => justify(fig))),
    
    new Paragraph({ text: "9. Detailed description of the invention:", heading: HeadingLevel.HEADING_1 }),
    ...(draft.detailedDescription.split('\n').filter(p => p.trim()).map(p => justify(p.trim()))),
    boldHeading("Example"),
    ...(draft.example.split('\n').filter(p => p.trim()).map(p => justify(p.trim()))),
    
    new Paragraph({ text: "Best method of performance of the invention:", heading: HeadingLevel.HEADING_1 }),
    ...(draft.bestMethod ? draft.bestMethod.split('\n').filter(p => p.trim()).map(p => justify(p.trim())) : []),
    
    new Paragraph({ text: "CLAIMS:", heading: HeadingLevel.HEADING_1 }),
    ...(draft.claims ? draft.claims.map((claim, i) => justify(`Claim ${i + 1} - ${claim}`)) : []),

    new Paragraph({ text: "Inventive step of your invention:", heading: HeadingLevel.HEADING_1 }),
    ...(draft.inventiveStep ? draft.inventiveStep.split('\n').filter(p => p.trim()).map(p => justify(p.trim())) : []),

    new Paragraph({ text: "Industrial application:", heading: HeadingLevel.HEADING_1 }),
    ...(draft.industrialApplication ? draft.industrialApplication.split('\n').filter(p => p.trim()).map(p => justify(p.trim())) : []),

    new Paragraph({ text: "Abstract:", heading: HeadingLevel.HEADING_1 }),
    ...(draft.abstract ? draft.abstract.split('\n').filter(p => p.trim()).map(p => justify(p.trim())) : []),
    
    new Paragraph({ text: "Drawing", heading: HeadingLevel.HEADING_1 })
  ];

  if (draft.diagramSVGs && draft.diagramSVGs.length > 0) {
    for (let i = 0; i < draft.diagramSVGs.length; i++) {
      try {
        const svgBuffer = Buffer.from(draft.diagramSVGs[i]);
        const pngBuffer = await sharp(svgBuffer).png().toBuffer();
        
        children.push(new Paragraph({
          children: [
            new ImageRun({
              data: pngBuffer,
              transformation: { width: 500, height: 400 }
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        }));
        children.push(new Paragraph({ text: `FIG. ${i + 1}`, alignment: AlignmentType.CENTER, spacing: { after: 240 } }));
      } catch (err) {
        console.error("Failed to convert SVG to PNG:", err);
      }
    }
  }

  const doc = new Document({
    creator: "VIT Patent Generator",
    styles: {
      default: {
        document: {
          run: {
            font: "Times New Roman",
            size: 24, // 12pt
          },
        },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            font: "Times New Roman",
            size: 24,
            bold: true,
          },
          paragraph: {
            spacing: { before: 400, after: 200 },
          },
        }
      ]
    },
    sections: [{
      properties: {},
      children
    }]
  });

  return await Packer.toBuffer(doc);
}

module.exports = { buildDocx };

import PDFDocument from 'pdfkit';
import { envVars } from '../../../config/env';


interface PrescriptionData {
    doctorName: string;
    doctorEmail: string;
    patientName: string;
    patientEmail: string;
    followUpDate: Date;
    instructions: string;
    prescriptionId: string;
    appointmentDate: Date;
    createdAt: Date;
}
//The function `generatePrescriptionPDF()` takes the prescription data, creates a PDF file, and finally returns that PDF as a Buffer.

//A Buffer is a special data type in Node.js used to store binary data (such as images, PDFs, videos, audio, etc.) in memory.Simply put:strings hold text, whereas Buffers hold the raw data of files.

//It is taking prescriptionData as input. Make a PDF. Then return buffer
export const generatePrescriptionPDF = async (prescriptionData: PrescriptionData): Promise<Buffer> => {

    //Generating the PDF takes some time.That is why a Promise has been used. if success ->resolve, if error->reject
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({  //create PDF Document 
                size: 'A4', //fix Page Size = A4
                margin: 50, //fix Margin = 50px
            });

            const chunks: Buffer[] = []; //Small buffer chunks are generated while the PDF is being created.They will be stored here.

            doc.on('data', (chunk) => {
                chunks.push(chunk);  //When a new part of the PDF is created, it will be added to the array.
            });

            doc.on('end', () => {
                resolve(Buffer.concat(chunks)); //Once the PDF is fully generated,all chunks will be combined and returned.
            });

            doc.on('error', (error) => {
                reject(error); //The Promise will be rejected if any issue occurs while generating the PDF.
            });

            // Title
            doc.fontSize(24).font('Helvetica-Bold').text('PRESCRIPTION', { //Write in large letters at the top of the PDF 'PRESCRIPTION'
                align: 'center',
            });

            doc.moveDown(0.5);
            doc
                .fontSize(10)
                .font('Helvetica')
                .text('PH Healthcare Services', {
                    align: 'center',
                });
            doc.text('Your Health, Our Priority', { align: 'center' }); // output:PH Healthcare Services.Your Health, Our Priority

            doc.moveDown(1);

            // Horizontal line
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(); //output:--------------------------

            doc.moveDown(1);

            // Doctor Information
            doc.fontSize(11).font('Helvetica-Bold').text('Doctor Information');
            doc
                .fontSize(10)
                .font('Helvetica')
                .text(`Name: ${prescriptionData.doctorName}`) // output:Name: Dr. John
                .text(`Email: ${prescriptionData.doctorEmail}`);//output:Email: john@gmail.com

            doc.moveDown(0.8);

            // Patient Information
            doc.fontSize(11).font('Helvetica-Bold').text('Patient Information');
            doc
                .fontSize(10)
                .font('Helvetica')
                .text(`Name: ${prescriptionData.patientName}`) //output:Name: Rahim
                .text(`Email: ${prescriptionData.patientEmail}`);//output:Email: rahim@gmail.com

            doc.moveDown(0.8);

            // Appointment & Prescription Details
            doc.fontSize(11).font('Helvetica-Bold').text('Prescription Details');
            doc
                .fontSize(10)
                .font('Helvetica')
                .text(`Prescription ID: ${prescriptionData.prescriptionId}`)//output: Prescription ID: P123
                .text(`Appointment Date: ${new Date(prescriptionData.appointmentDate).toLocaleDateString()}`) //output: Appointment Date: 6/23/2026
                .text(`Issued Date: ${new Date(prescriptionData.createdAt).toLocaleDateString()}`); //output: Issued Date: 6/23/2026

            if (prescriptionData.followUpDate) {
                doc.text(
                    `Follow-up Date: ${new Date(prescriptionData.followUpDate).toLocaleDateString()}`//output:Follow-up Date: 7/10/2026
                );
            }

            doc.moveDown(1);

            // Horizontal line
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();

            doc.moveDown(1);

            // Instructions/Medications
            doc.fontSize(11).font('Helvetica-Bold').text('Instructions'); //output:Instructions:Take medicine twice daily after meals.Drink plenty of water.
            doc.fontSize(10).font('Helvetica');

            // Wrap text for long instructions
            doc.text(prescriptionData.instructions, {
                align: 'left',
                width: 445,
            });

            doc.moveDown(1);

            // Horizontal line
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();

            doc.moveDown(1);

            // Footer
            doc.fontSize(9).font('Helvetica').text(
                'This is an electronically generated prescription. Please follow all instructions provided by your doctor.',
                {
                    align: 'center',
                }
            );

            doc.text(`For more information, visit: ${envVars.FRONTEND_URL}`, {
                align: 'center',
            });

            // End the document
            doc.end();
        } catch (error) {
            reject(error);
        }
    })
}
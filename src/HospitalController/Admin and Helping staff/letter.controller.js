import { ApiResponse } from "../../HospitalUtils/ApiResponse.js";
import { asynchandler } from "../../HospitalUtils/asynchandler.js";
import { PDFGenerator } from "../../HospitalUtils/fileuploadingUtils/generatePrescriptionPDF.js";
import { letterQueue } from "../../jobs/letter.queue.js";

const generateAndScheduleLetter = async (res, letterDetails) => {
    const { name, email, htmlContent, subject, pdfFilename } = letterDetails;

    
    const pdfUrl = await PDFGenerator.generate({
        html: htmlContent,
        filename: pdfFilename,
        folder: "letters",
    });

    
    await letterQueue.add('send-email', {
        name, 
        to: email,
        subject: subject,
        html: `<p>Dear ${name},</p><p>Please find your official letter from Your Hospital Name attached to this email.</p><p>Regards,<br/>The Management</p>`,
        attachments: [{
            filename: pdfFilename,
            path: pdfUrl,
        }],
    });

    
    return res.status(200).json(new ApiResponse(
        200,
        { pdfUrl },
        `${subject} has been successfully queued for delivery.`
    ));
};




export const generateAcceptanceLetter = asynchandler(async (req, res) => {
    const { name, email, address, position, startDate, salary, reportingManager } = req.body;
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const logoUrl = "https://res.cloudinary.com/dfhcviz9w/image/upload/v1747924300/medical_records_d9uis4.png";

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: auto; border: 1px solid #eee; padding: 20px; line-height: 1.6;">
            <style>.header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:2px solid #007BFF}.header img{max-height:70px}.header .clinic-info{text-align:right;font-size:12px;color:#555}.content{padding:20px 0}.signature{margin-top:40px;text-align:left}.footer{text-align:center;font-size:12px;color:#777;padding-top:20px;border-top:1px solid #eee;margin-top:40px}</style>
            <div class="header">
                <img src="${logoUrl}" alt="Hospital Logo">
                <div class="clinic-info"><strong>Your Hospital Name</strong><br>Karigiri, Tamil Nadu, India</div>
            </div>
            <div class="content">
                <p style="text-align: right;"><strong>Date:</strong> ${currentDate}</p>
                <p><strong>${name}</strong><br>${address}</p><br>
                <h3 style="color: #007BFF;">Subject: Offer of Employment</h3>
                <p>Dear ${name},</p>
                <p>Following our recent discussions, we are delighted to offer you the position of <strong>${position}</strong> at Your Hospital Name. We were impressed with your qualifications and believe you will be a valuable asset to our team.</p>
                <p>Your employment will commence on <strong>${startDate}</strong>, reporting to <strong>${reportingManager}</strong>. Your annual salary will be <strong>$${salary}</strong>, payable in monthly installments.</p>
                <p>We are excited about the prospect of you joining us.</p>
                <div class="signature">
                    <p>Sincerely,</p>
                    <p><strong>Hitansh Sondhi</strong></p>
                    <p><em>Associate Director, Management</em></p>
                </div>
            </div>
            <div class="footer"><p>&copy; ${new Date().getFullYear()} Your Hospital Name. All Rights Reserved.</p></div>
        </div>`;

    await generateAndScheduleLetter(res, { name, email, htmlContent, subject: "Your Offer from Your Hospital Name", pdfFilename: `Acceptance_Letter_${name}.pdf` });
});

export const generatePromotionLetter = asynchandler(async (req, res) => {
    const { name, email, oldPosition, newPosition, effectiveDate, newSalary } = req.body;
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const logoUrl = "https://res.cloudinary.com/dfhcviz9w/image/upload/v1747924300/medical_records_d9uis4.png";

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: auto; border: 1px solid #eee; padding: 20px; line-height: 1.6;">
            <style>.header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:2px solid #28a745}.header img{max-height:70px}.header .clinic-info{text-align:right;font-size:12px;color:#555}.content{padding:20px 0}.signature{margin-top:40px;text-align:left}.footer{text-align:center;font-size:12px;color:#777;padding-top:20px;border-top:1px solid #eee;margin-top:40px}</style>
            <div class="header">
                <img src="${logoUrl}" alt="Hospital Logo">
                <div class="clinic-info"><strong>Your Hospital Name</strong><br>Karigiri, Tamil Nadu, India</div>
            </div>
            <div class="content">
                <p style="text-align: right;"><strong>Date:</strong> ${currentDate}</p>
                <p><strong>${name}</strong><br>Employee</p><br>
                <h3 style="color: #28a745;">Subject: Congratulations on Your Promotion</h3>
                <p>Dear ${name},</p>
                <p>On behalf of the management, we are thrilled to congratulate you on your promotion from <strong>${oldPosition}</strong> to <strong>${newPosition}</strong>, effective <strong>${effectiveDate}</strong>.</p>
                <p>This promotion recognizes your exceptional performance and valuable contributions. In line with your new responsibilities, your annual salary has been revised to <strong>$${newSalary}</strong>.</p>
                <p>We wish you the very best and look forward to your continued success.</p>
                <div class="signature">
                    <p>Sincerely,</p>
                    <p><strong>Hitansh Sondhi</strong></p>
                    <p><em>Associate Director, Management</em></p>
                </div>
            </div>
            <div class="footer"><p>&copy; ${new Date().getFullYear()} Your Hospital Name. All Rights Reserved.</p></div>
        </div>`;

    await generateAndScheduleLetter(res, { name, email, htmlContent, subject: "Congratulations on Your Promotion!", pdfFilename: `Promotion_Letter_${name}.pdf` });
});

export const generateTerminationLetter = asynchandler(async (req, res) => {
    const { name, email, position, terminationDate, reason } = req.body;
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const logoUrl = "https://res.cloudinary.com/dfhcviz9w/image/upload/v1747924300/medical_records_d9uis4.png";

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: auto; border: 1px solid #eee; padding: 20px; line-height: 1.6;">
            <style>.header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:2px solid #dc3545}.header img{max-height:70px}.header .clinic-info{text-align:right;font-size:12px;color:#555}.content{padding:20px 0}.signature{margin-top:40px;text-align:left}.footer{text-align:center;font-size:12px;color:#777;padding-top:20px;border-top:1px solid #eee;margin-top:40px}</style>
            <div class="header">
                <img src="${logoUrl}" alt="Hospital Logo">
                <div class="clinic-info"><strong>Your Hospital Name</strong><br>Karigiri, Tamil Nadu, India</div>
            </div>
            <div class="content">
                <p style="text-align: right;"><strong>PRIVATE AND CONFIDENTIAL</strong><br><strong>Date:</strong> ${currentDate}</p>
                <p><strong>${name}</strong><br>Employee</p><br>
                <h3 style="color: #dc3545;">Subject: Notice of Employment Termination</h3>
                <p>Dear ${name},</p>
                <p>This letter confirms that your employment with Your Hospital Name as a <strong>${position}</strong> will be terminated, effective at the end of the business day on <strong>${terminationDate}</strong>.</p>
                <p>This decision was made for the following reason: <strong>${reason}</strong>.</p>
                <p>Information regarding your final pay and the return of company property will be provided separately. We wish you the best in your future endeavors.</p>
                <div class="signature">
                    <p>Sincerely,</p>
                    <p><strong>Hitansh Sondhi</strong></p>
                    <p><em>Associate Director, Management</em></p>
                </div>
            </div>
            <div class="footer"><p>&copy; ${new Date().getFullYear()} Your Hospital Name. All Rights Reserved.</p></div>
        </div>`;

    await generateAndScheduleLetter(res, { name, email, htmlContent, subject: "Notice of Employment Termination", pdfFilename: `Termination_Letter_${name}.pdf` });
});
const PDFDocument = require('pdfkit');
const { supabase } = require('../config/database');
const { NotFoundError } = require('../utils/errorTypes');

/**
 * Generate PDF for transport request
 */
const generateRequestPDF = async (requestId) => {
    // Fetch request details with all related data
    const { data: request, error } = await supabase
        .from('transport_requests')
        .select(`
      *,
      requester:users!transport_requests_user_id_fkey(full_name, email, department, designation),
      head:users!transport_requests_custom_head_email_fkey(full_name, email),
      vehicle:vehicles(vehicle_number, vehicle_type, driver_name, driver_phone),
      approvals(
        id,
        action,
        comments,
        created_at,
        approver:users!approvals_approver_id_fkey(full_name, role)
      ),
      travel_details(
        start_meter_reading,
        end_meter_reading,
        total_km,
        rate_per_km,
        night_charges,
        total_amount,
        completed_at
      )
    `)
        .eq('id', requestId)
        .single();

    if (error || !request) {
        throw new NotFoundError('Transport request not found');
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Helper function to add a line
    const addLine = (y) => {
        doc.moveTo(50, y).lineTo(550, y).stroke();
    };

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('THAPAR INSTITUTE OF ENGINEERING & TECHNOLOGY', {
        align: 'center'
    });
    doc.moveDown(0.5);
    doc.fontSize(16).text('Transport Request', { align: 'center' });
    doc.moveDown(1);

    addLine(doc.y);
    doc.moveDown(1);

    // Request Details
    doc.fontSize(14).font('Helvetica-Bold').text('Request Information');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');

    const startY = doc.y;
    doc.text(`Request Number: ${request.request_number}`, 50, startY);
    doc.text(`Status: ${request.current_status.replace(/_/g, ' ').toUpperCase()}`, 300, startY);

    doc.moveDown(0.5);
    doc.text(`Submitted On: ${new Date(request.submitted_at).toLocaleDateString('en-IN')}`);
    doc.text(`Department: ${request.department}`);
    doc.text(`Designation: ${request.designation}`);

    doc.moveDown(1);
    addLine(doc.y);
    doc.moveDown(1);

    // Requester Details
    doc.fontSize(14).font('Helvetica-Bold').text('Requester Details');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Name: ${request.requester?.full_name || 'N/A'}`);
    doc.text(`Email: ${request.requester?.email || 'N/A'}`);

    doc.moveDown(1);
    addLine(doc.y);
    doc.moveDown(1);

    // Visit Details
    doc.fontSize(14).font('Helvetica-Bold').text('Visit Details');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Date of Visit: ${new Date(request.date_of_visit).toLocaleDateString('en-IN')}`);
    doc.text(`Time of Visit: ${request.time_of_visit}`);
    doc.text(`Place of Visit: ${request.place_of_visit}`);
    doc.text(`Number of Persons: ${request.number_of_persons}`);
    doc.moveDown(0.5);
    doc.text('Purpose:', { continued: false });
    doc.moveDown(0.3);
    doc.text(request.purpose, { width: 500 });

    doc.moveDown(1);
    addLine(doc.y);
    doc.moveDown(1);

    // Head Approval
    doc.fontSize(14).font('Helvetica-Bold').text('Head Approval');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Head Name: ${request.head?.full_name || request.custom_head_name || 'N/A'}`);
    doc.text(`Head Email: ${request.custom_head_email || 'N/A'}`);

    // Vehicle Details (if assigned)
    if (request.vehicle) {
        doc.moveDown(1);
        addLine(doc.y);
        doc.moveDown(1);

        doc.fontSize(14).font('Helvetica-Bold').text('Vehicle Details');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Vehicle Number: ${request.vehicle.vehicle_number}`);
        doc.text(`Vehicle Type: ${request.vehicle.vehicle_type.toUpperCase()}`);
        doc.text(`Driver Name: ${request.vehicle.driver_name || request.driver_name || 'N/A'}`);
        doc.text(`Driver Phone: ${request.vehicle.driver_phone || request.driver_phone || 'N/A'}`);
    }

    // Travel Details (if completed)
    if (request.travel_details && request.travel_details.length > 0) {
        const travel = request.travel_details[0];
        doc.moveDown(1);
        addLine(doc.y);
        doc.moveDown(1);

        doc.fontSize(14).font('Helvetica-Bold').text('Travel Details');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Start Meter Reading: ${travel.start_meter_reading} km`);
        doc.text(`End Meter Reading: ${travel.end_meter_reading} km`);
        doc.text(`Total Distance: ${travel.total_km} km`);
        doc.text(`Rate per KM: ₹${travel.rate_per_km}`);
        if (travel.night_charges > 0) {
            doc.text(`Night Charges: ₹${travel.night_charges}`);
        }
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text(`Total Amount: ₹${travel.total_amount}`, { underline: true });
        doc.font('Helvetica');
    }

    // Approval History
    if (request.approvals && request.approvals.length > 0) {
        doc.addPage();
        doc.fontSize(14).font('Helvetica-Bold').text('Approval History');
        doc.moveDown(0.5);

        request.approvals.forEach((approval, index) => {
            doc.fontSize(10).font('Helvetica');
            doc.text(`${index + 1}. ${approval.approver?.full_name || 'Unknown'} (${approval.approver?.role || 'N/A'})`);
            doc.text(`   Action: ${approval.action.toUpperCase()}`);
            doc.text(`   Date: ${new Date(approval.created_at).toLocaleString('en-IN')}`);
            if (approval.comments) {
                doc.text(`   Comments: ${approval.comments}`);
            }
            doc.moveDown(0.5);
        });
    }

    // Footer
    doc.fontSize(8).font('Helvetica').text(
        `Generated on ${new Date().toLocaleString('en-IN')}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
    );

    return doc;
};

/**
 * Generate PDF for travel details
 */
const generateTravelDetailsPDF = async (requestId) => {
    // Similar to above but focused on travel details
    // Implementation can be added based on specific requirements
    return generateRequestPDF(requestId);
};

module.exports = {
    generateRequestPDF,
    generateTravelDetailsPDF
};

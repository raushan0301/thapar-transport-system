const { generateRequestPDF } = require('../services/pdfService');
const { generateRequestsExcel, generateVehiclesExcel, generateAnalyticsExcel } = require('../services/excelService');
const { successResponse } = require('../utils/responseFormatter');
const { NotFoundError } = require('../utils/errorTypes');
const { supabase } = require('../config/database');

/**
 * Generate PDF for a transport request
 */
const generateRequestPDFController = async (req, res, next) => {
    try {
        const { id } = req.params;

        // IDOR Protection: Ensure standard users can only export their own requests
        if (req.profile.role === 'user') {
            const { data: reqCheck, error: checkErr } = await supabase
                .from('transport_requests')
                .select('user_id')
                .eq('id', id)
                .single();
            
            if (checkErr || !reqCheck) throw new NotFoundError('Transport request not found');
            if (reqCheck.user_id !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Unauthorized to view this request PDF' });
            }
        }

        const pdfDoc = await generateRequestPDF(id);

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=transport-request-${id}.pdf`);

        // Pipe PDF to response
        pdfDoc.pipe(res);
        pdfDoc.end();
    } catch (error) {
        next(error);
    }
};

/**
 * Export transport requests to Excel
 */
const exportRequestsController = async (req, res, next) => {
    try {
        const filters = {
            status: req.query.status,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            department: req.query.department
        };

        const workbook = await generateRequestsExcel(filters);

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=transport-requests-${Date.now()}.xlsx`);

        // Write to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        next(error);
    }
};

/**
 * Export vehicles to Excel
 */
const exportVehiclesController = async (req, res, next) => {
    try {
        const workbook = await generateVehiclesExcel();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=vehicles-${Date.now()}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        next(error);
    }
};

/**
 * Export analytics report to Excel
 */
const exportAnalyticsController = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            throw new ValidationError('Start date and end date are required');
        }

        const workbook = await generateAnalyticsExcel(startDate, endDate);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=analytics-${Date.now()}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    generateRequestPDFController,
    exportRequestsController,
    exportVehiclesController,
    exportAnalyticsController
};

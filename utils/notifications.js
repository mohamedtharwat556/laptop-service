const nodemailer = require('nodemailer');

// Email configuration
const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
};

// WhatsApp configuration (using WhatsApp Business API)
const whatsappConfig = {
    apiUrl: process.env.WHATSAPP_API_URL,
    apiKey: process.env.WHATSAPP_API_KEY,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID
};

// Create email transporter
let transporter = null;

if (emailConfig.auth.user && emailConfig.auth.pass) {
    transporter = nodemailer.createTransport(emailConfig);
}

/**
 * Send email notification
 * @param {object} options - Email options
 * @returns {object} - Result
 */
async function sendEmail(options) {
    try {
        if (!transporter) {
            console.warn('Email transporter not configured');
            return { success: false, error: 'Email not configured' };
        }

        const mailOptions = {
            from: `"YAS Laptop Service" <${emailConfig.auth.user}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error };
    }
}

/**
 * Send WhatsApp message
 * @param {string} phoneNumber - Phone number (with country code, no +)
 * @param {string} message - Message content
 * @returns {object} - Result
 */
async function sendWhatsAppMessage(phoneNumber, message) {
    try {
        if (!whatsappConfig.apiUrl || !whatsappConfig.apiKey) {
            console.warn('WhatsApp API not configured, using fallback');
            // Fallback: log the message
            console.log(`WhatsApp to ${phoneNumber}: ${message}`);
            return { success: true, fallback: true };
        }

        const response = await fetch(`${whatsappConfig.apiUrl}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${whatsappConfig.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: phoneNumber,
                type: 'text',
                text: { body: message }
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('WhatsApp message sent:', data);
            return { success: true, messageId: data.messages[0]?.id };
        } else {
            console.error('WhatsApp API error:', data);
            return { success: false, error: data };
        }
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        return { success: false, error };
    }
}

/**
 * Send notification to customer about request status update
 * @param {object} request - Request object
 * @param {string} newStatus - New status
 * @returns {object} - Result
 */
async function notifyCustomerStatusUpdate(request, newStatus) {
    try {
        const results = { email: null, whatsapp: null };
        
        // Status messages in Arabic
        const statusMessages = {
            'Received': 'تم استلام جهازك بنجاح',
            'Waiting Inspection': 'جهازك بانتظار الفحص',
            'Under Maintenance': 'جهازك قيد الصيانة حالياً',
            'Waiting Parts': 'بانتظار وصول قطع الغيار',
            'Ready for Pickup': 'جهازك جاهز للاستلام',
            'Completed': 'تم إصلاح جهازك بنجاح'
        };

        const statusMessage = statusMessages[newStatus] || newStatus;
        
        // Send WhatsApp notification
        if (request.phone) {
            const whatsappMessage = `
🔔 تحديث حالة الطلب

مرحباً ${request.fullName}،

${statusMessage}

رقم الطلب: ${request.requestNumber}
نوع الجهاز: ${request.deviceType || '—'}

يمكنك تتبع حالة طلبك من خلال موقعنا.

شكراً لاختيارك YAS Laptop Service!
            `.trim();

            results.whatsapp = await sendWhatsAppMessage(request.phone, whatsappMessage);
        }

        // Send email notification
        if (request.email) {
            const emailHtml = `
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0;">🔔 تحديث حالة الطلب</h1>
                    </div>
                    <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
                        <p style="font-size: 18px; margin-bottom: 20px;">مرحباً <strong>${request.fullName}</strong>،</p>
                        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
                            <p style="font-size: 16px; margin: 0; color: #1e293b;">${statusMessage}</p>
                        </div>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>رقم الطلب:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${request.requestNumber}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>نوع الجهاز:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${request.deviceType || '—'}</td>
                            </tr>
                        </table>
                        <p style="color: #64748b; margin-bottom: 20px;">يمكنك تتبع حالة طلبك من خلال موقعنا.</p>
                        <div style="text-align: center;">
                            <a href="https://laptop-service-weld.vercel.app/track.html" style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">تتبع الطلب</a>
                        </div>
                    </div>
                    <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px;">
                        <p>شكراً لاختيارك <strong>YAS Laptop Service</strong></p>
                    </div>
                </div>
            `;

            results.email = await sendEmail({
                to: request.email,
                subject: `تحديث حالة الطلب - ${request.requestNumber}`,
                html: emailHtml,
                text: `تحديث حالة الطلب: ${statusMessage}\nرقم الطلب: ${request.requestNumber}`
            });
        }

        return { success: true, results };
    } catch (error) {
        console.error('Error notifying customer:', error);
        return { success: false, error };
    }
}

/**
 * Send notification to admin about new request
 * @param {object} request - Request object
 * @returns {object} - Result
 */
async function notifyAdminNewRequest(request) {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@yas-laptop-service.com';
        
        const emailHtml = `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">📋 طلب صيانة جديد</h1>
                </div>
                <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>رقم الطلب:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${request.requestNumber}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>اسم العميل:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${request.fullName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>رقم الهاتف:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${request.phone}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>ماركة اللابتوب:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${request.laptopBrand}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>الموديل:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${request.laptopModel || '—'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>نوع الجهاز:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${request.deviceType}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>الأولوية:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${request.priority || 'Medium'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>المشكلة:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${request.problemDescription}</td>
                        </tr>
                    </table>
                    <div style="text-align: center;">
                        <a href="https://laptop-service-weld.vercel.app/admin.html" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">عرض الطلب</a>
                    </div>
                </div>
            </div>
        `;

        const result = await sendEmail({
            to: adminEmail,
            subject: `طلب صيانة جديد - ${request.requestNumber}`,
            html: emailHtml,
            text: `طلب صيانة جديد من ${request.fullName}\nرقم الطلب: ${request.requestNumber}`
        });

        return result;
    } catch (error) {
        console.error('Error notifying admin:', error);
        return { success: false, error };
    }
}

/**
 * Send notification when request is completed
 * @param {object} request - Request object
 * @returns {object} - Result
 */
async function notifyCustomerCompletion(request) {
    try {
        const results = { email: null, whatsapp: null };
        
        // Send WhatsApp notification
        if (request.phone) {
            const whatsappMessage = `
✅ تم إصلاح جهازك بنجاح!

مرحباً ${request.fullName}،

تم الانتهاء من إصلاح جهازك وهو جاهز للاستلام.

رقم الطلب: ${request.requestNumber}
التكلفة: ${request.cost ? request.cost + ' ج.م' : 'سيتم تحديدها'}

يرجى التواصل معنا لتحديد موعد الاستلام.

شكراً لاختيارك YAS Laptop Service!
            `.trim();

            results.whatsapp = await sendWhatsAppMessage(request.phone, whatsappMessage);
        }

        // Send email notification
        if (request.email) {
            const emailHtml = `
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0;">✅ تم إصلاح جهازك بنجاح!</h1>
                    </div>
                    <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
                        <p style="font-size: 18px; margin-bottom: 20px;">مرحباً <strong>${request.fullName}</strong>،</p>
                        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 20px;">
                            <p style="font-size: 16px; margin: 0; color: #1e293b;">تم الانتهاء من إصلاح جهازك وهو جاهز للاستلام.</p>
                        </div>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>رقم الطلب:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${request.requestNumber}</td>
                            </tr>
                            ${request.cost ? `
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>التكلفة:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${request.cost} ج.م</td>
                            </tr>
                            ` : ''}
                        </table>
                        <p style="color: #64748b; margin-bottom: 20px;">يرجى التواصل معنا لتحديد موعد الاستلام.</p>
                        <div style="text-align: center;">
                            <a href="https://laptop-service-weld.vercel.app/track.html" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">تتبع الطلب</a>
                        </div>
                    </div>
                    <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px;">
                        <p>شكراً لاختيارك <strong>YAS Laptop Service</strong></p>
                    </div>
                </div>
            `;

            results.email = await sendEmail({
                to: request.email,
                subject: `تم إصلاح جهازك - ${request.requestNumber}`,
                html: emailHtml,
                text: `تم إصلاح جهازك بنجاح وهو جاهز للاستلام.\nرقم الطلب: ${request.requestNumber}`
            });
        }

        return { success: true, results };
    } catch (error) {
        console.error('Error notifying customer completion:', error);
        return { success: false, error };
    }
}

module.exports = {
    sendEmail,
    sendWhatsAppMessage,
    notifyCustomerStatusUpdate,
    notifyAdminNewRequest,
    notifyCustomerCompletion
};

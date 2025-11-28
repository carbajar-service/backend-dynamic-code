const mongoose = require('mongoose');
const nodeCron = require('node-cron');
const { generatePdfFromHtml, uploadPdfToCloudinary } = require('../services/pdfService');
const { sendEmailWithAttachment } = require('../services/emailService'); // 👈 Create this separately
const config = require('../config/index');

// 🔄 Dynamic model
const getDynamicModel = (collectionName) => {
  const schema = new mongoose.Schema({}, { strict: false });
  return mongoose.models[collectionName] || mongoose.model(collectionName, schema, collectionName);
};

const Product = getDynamicModel('products');

// 🕓 Schedule to run every 12 hours (adjust as needed)
nodeCron.schedule('0 */12 * * *', async () => {
  console.log('⏰ Running PDF sending cron job...');

  try {
    const products = await Product.find({ leadStatus: 'completed', sendPdf: false });

    for (const product of products) {
      try {
        const pdfBuffer = await generatePdfFromHtml(product);
        const pdfUrl = await uploadPdfToCloudinary(pdfBuffer, `product_${product._id}`);

        await sendEmailWithAttachment({
          to: product.email || config.ADMIN_EMAIL, // 👈 Use dynamic or default
          subject: 'Product Completion Report',
          html: `<p>Dear user,</p><p>Your product is now marked as completed. You can download your report <a href="${pdfUrl}">here</a>.</p>`,
          attachments: [
            {
              filename: `product_report_${product._id}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf',
            },
          ],
        });

        product.sendPdf = true;
        await product.save();

        console.log(`✅ PDF sent and updated for product: ${product._id}`);
      } catch (err) {
        console.error(`❌ Error processing product ${product._id}:`, err);
      }
    }

  } catch (err) {
    console.error('❌ Error running cron job:', err);
  }
});

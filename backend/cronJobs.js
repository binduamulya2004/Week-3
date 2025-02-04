const axios = require('axios');
const XLSX = require('xlsx');
const cron = require('node-cron');
const { uploadToS3 } = require('./controllers/authController');
const knex = require('./mysql/connection');
const crypto = require('crypto');
const {validateProduct}=require('./validations/productvalidations');
const BATCH_SIZE = 500; // Process in batches of 500
async function processPendingFiles() {
    try {
        console.log('Checking for pending files...');

        const pendingFiles = await knex('import_files').where('status', 'pending');

        for (const file of pendingFiles) {
            console.log(`Processing file: ${file.file_url}`);

            try {
                // Fetch file from S3
                const response = await axios.get(file.file_url, { responseType: 'arraybuffer' });
                const fileBuffer = response.data;

                // Compute hash of downloaded file
                const computedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
                if (computedHash !== file.checksum) {
                    console.error(`Checksum mismatch for file ${file.file_name}. Possible corruption.`);
                    await knex('import_files').where('id', file.id).update({ status: 'error' });
                    continue;
                }

                const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const records = XLSX.utils.sheet_to_json(worksheet);

                if (records.length === 0) {
                    console.error(`Empty file: ${file.file_name}`);
                    await knex('import_files').where('id', file.id).update({ status: 'error' });
                    continue;
                }

                // Required columns
                const requiredColumns = ["product_name", "vendors", "category_name", "unit_price", "quantity_in_stock"];
                const fileColumns = Object.keys(records[0]).map(col => col.trim());

                // Check if any required column is missing
                const missingColumns = requiredColumns.filter(col => !fileColumns.includes(col));

                if (missingColumns.length > 0) {
                    console.error(`Missing required columns: ${missingColumns.join(', ')}`);
                    await knex('import_files').where('id', file.id).update({ status: 'error' });
                    continue;
                }

                let errors = [];
                let validProducts = [];
                let vendorProductMappings = [];

                // Process each record
                for (const record of records) {
                    let sanitizedRecord = {};
                    let recordErrors = [];

                    // Extract only required fields and ignore extra ones
                    for (let col of requiredColumns) {
                        sanitizedRecord[col] = record[col] ? record[col].toString().trim() : '';
                    }

                    // Validate the record using Joi
                    const { error } = validateProduct(sanitizedRecord);
                    if (error) {
                        recordErrors.push(...error.details.map(err => err.message));
                    }

                    if (recordErrors.length > 0) {
                        console.log(`Validation failed for product: ${sanitizedRecord.product_name}`);
                        errors.push({ ...sanitizedRecord, error: recordErrors.join(', ') });
                        continue;
                    }

                    try {
                        // Validate category
                        let category = await knex('categories')
                            .where('category_name', sanitizedRecord.category_name)
                            .first();

                        if (!category) {
                            console.log(`Category not found: ${sanitizedRecord.category_name}`);
                            errors.push({ ...sanitizedRecord, error: `Category "${sanitizedRecord.category_name}" doesn't exist` });
                            continue;
                        }

                        // Validate vendors
                        let vendors = sanitizedRecord.vendors.split(',').map(v => v.trim());
                        let validVendors = [];

                        for (let vendorName of vendors) {
                            let vendor = await knex('vendors').where('vendor_name', vendorName).first();
                            if (!vendor) {
                                console.log(`Vendor not found: ${vendorName}`);
                                errors.push({ ...sanitizedRecord, error: `Vendor "${vendorName}" doesn't exist` });
                                continue;
                            }
                            validVendors.push(vendor);
                        }

                        if (validVendors.length === 0) {
                            errors.push({ ...sanitizedRecord, error: 'No valid vendors found' });
                            continue;
                        }

                        // Check if product exists
                        let existingProduct = await knex('products').where('product_name', sanitizedRecord.product_name).first();

                        const productData = {
                            product_name: sanitizedRecord.product_name,
                            category_id: category.category_id,
                            unit_price: sanitizedRecord.unit_price,
                            quantity_in_stock: sanitizedRecord.quantity_in_stock,
                            status: 1
                        };

                        if (existingProduct) {
                            // Update existing product
                            await knex('products')
                                .where('product_id', existingProduct.product_id)
                                .update(productData);
                        } else {
                            // Insert new product
                            validProducts.push(productData);
                        }

                        // Prepare vendor-product mappings
                        for (const vendor of validVendors) {
                            vendorProductMappings.push({
                                product_name: sanitizedRecord.product_name,
                                vendor_id: vendor.vendor_id
                            });
                        }

                    } catch (err) {
                        console.error(`Error processing record ${sanitizedRecord.product_name}: ${err.message}`);
                        errors.push({ ...sanitizedRecord, error: err.message });
                    }
                }

                // Insert valid products in batches
                while (validProducts.length > 0) {
                    let batch = validProducts.splice(0, BATCH_SIZE);
                    try {
                        await knex.batchInsert('products', batch, BATCH_SIZE);
                    } catch (error) {
                        console.error('Error inserting products:', error);
                    }
                }

                // Get product_ids for vendor-product mappings
                const productMap = new Map();
                for (const record of records) {
                    let product = await knex('products').where('product_name', record.product_name).first();
                    if (product) {
                        productMap.set(record.product_name, product.product_id);
                    }
                }

                // Insert vendor-product mappings in batches
                let finalVendorProductMappings = vendorProductMappings.map(vp => ({
                    product_id: productMap.get(vp.product_name),
                    vendor_id: vp.vendor_id,
                    status: 1
                }));

                while (finalVendorProductMappings.length > 0) {
                    let batch = finalVendorProductMappings.splice(0, BATCH_SIZE);
                    try {
                        await knex.batchInsert('product_to_vendor', batch, BATCH_SIZE);
                    } catch (error) {
                        console.error('Error inserting vendor-product mappings:', error);
                    }
                }

                // Handle errors
                if (errors.length > 0) {
                    const errorSheet = XLSX.utils.json_to_sheet(errors);
                    const errorWorkbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(errorWorkbook, errorSheet, 'Errors');

                    const errorFileName = `errors-${Date.now()}.xlsx`;
                    const errorBuffer = XLSX.write(errorWorkbook, { type: 'buffer', bookType: 'xlsx' });

                    const errorFileUrl = await uploadToS3(
                        errorBuffer,
                        errorFileName,
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        file.user_id
                    );

                    await knex('import_files').where('id', file.id).update({
                        status: 'error',
                        error_file_url: errorFileUrl
                    });
                } else {
                    await knex('import_files').where('id', file.id).update({ status: 'completed' });
                }

            } catch (error) {
                console.error('Error processing file:', error);
                await knex('import_files').where('id', file.id).update({ status: 'error' });
            }
        }
    } catch (error) {
        console.error('Error fetching pending files:', error);
    }
}


// Schedule CRON Job every 10 minutes
cron.schedule('*/10 * * * *', processPendingFiles);

console.log('CRON Job scheduled: Runs every 10 minutes.');

module.exports = { processPendingFiles };

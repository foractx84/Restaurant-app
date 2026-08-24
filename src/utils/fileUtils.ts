import { ERRORS } from '@/constants/errors.constants';
import { logger } from '@utils/logger';
import PDFDocument from 'pdfkit';
import { getBucket } from '@utils/GCP_bucket';
import { MenuDisclaimerInterface } from '@/interfaces/disclaimers.interface';
import { APP_CONFIG } from '@/configs/config';
import { GetMenuSectionsForMenuDetailsInterface } from '@/interfaces/menuSections.interface';

const { Document, Packer, Paragraph, TextRun } = require('docx');

export const generatePDFBuffer_PDF_Kit = async function (
  menuDisclaimers: MenuDisclaimerInterface[],
  sectionsData: GetMenuSectionsForMenuDetailsInterface[],
  prixMenu = false,
) {
  return new Promise(resolve => {
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // this is pdfkit
    doc.font('Helvetica-Bold');

    // Loop through the menu sections and menu items
    sectionsData.forEach(section => {
      // ignore hidden sections
      if (section.isHidden === true) {
        return;
      }

      // Add the section name (bold)
      doc.font('Helvetica-Bold');
      doc.fontSize(16).text(section.sectionName.toUpperCase().trim(), { align: 'left' });

      // Add the section description
      doc.font('Times-Italic');
      doc.fontSize(16).text(section.message.trim(), { align: 'left' });

      doc.moveDown(1);
      // Loop through menu items
      section.items.forEach(item => {
        // ignore hidden items
        if (item.isHidden === true) {
          return;
        }
        // Add menu item name
        doc.font('Helvetica-Bold');
        doc.fontSize(16).text(item.name.trim(), { align: 'left' });

        // Add menu item description if exists
        if (item?.description) {
          doc.font('Helvetica');
          doc.fontSize(16).text(item.description.trim(), { align: 'left' });
        }

        // Add menu item price by size
        doc.font('Helvetica');
        let sizesStr = '';
        if (item?.allItemSizes?.length > 1) {
          // if more than one size
          // first add baseItemSize label and price
          const formattedBasePrice = item.baseItemSize.priceOverride
            ? `${item.baseItemSize.priceOverride.trim()}`
            : `$${(item.baseItemSize.price / 100).toFixed(2).replace(/\.00$/, '')}`;

          if (formattedBasePrice !== 'prix' && !prixMenu) {
            // if not prix
            sizesStr += `${item?.baseItemSize?.label} - ${formattedBasePrice}`;
          } else {
            //  if prix
            sizesStr += `${item?.baseItemSize?.label}`;
          }

          // then add remaining sizes
          item?.allItemSizes.forEach(size => {
            // ignore if same as base item size since it has already been completed
            if (size.label === item.baseItemSize.label && size.price === item.baseItemSize.price) {
              return;
            }
            const formattedSizePrice = size.priceOverride ? `${size.priceOverride.trim()}` : `$${(size.price / 100).toFixed(2).replace(/\.00$/, '')}`;

            // concatenate sizes string with | pipe before each one
            if (formattedSizePrice !== 'prix' && !prixMenu) {
              sizesStr += ` | ${size?.label} - ${formattedSizePrice}`;
            } else {
              sizesStr += ` | ${size?.label}`;
            }
          });

          // write to document when all sizes are done
          doc.fontSize(16).text(`${sizesStr}`, { align: 'left' });
        } else {
          // no extra sizes, special case where only price is written

          const formattedPrice = item.baseItemSize.priceOverride
            ? `${item.baseItemSize.priceOverride.trim()}`
            : `$${(item.baseItemSize.price / 100).toFixed(2).replace(/\.00$/, '')}`;

          if (formattedPrice !== 'prix' && !prixMenu) {
            // write price to document
            doc.fontSize(16).text(`${formattedPrice}`, { align: 'left' });
          }
        }

        // add modifiers to item
        let modifiersStr = '';
        item?.modifierGroups?.forEach(group => {
          group?.modifiers.forEach(modifier => {
            const formattedModifierPrice = `$${(modifier.price / 100).toFixed(2).replace(/\.00$/, '')}`;

            // only add modifiers to strings if they have a price, ignore modifiers with no price
            if (modifier?.price) {
              if (modifiersStr.length === 0) {
                // first modifier will not have a | pipe in the string
                modifiersStr += `Add ${modifier.name.trim()} + ${formattedModifierPrice}`;
              } else {
                // remaining modifiers will have a | pipe in the string
                modifiersStr += ` | Add ${modifier.name.trim()} + ${formattedModifierPrice}`;
              }
            }
          });
        });
        doc.font('Helvetica');
        // if any modifiers exist for the item, then write them to the doc
        if (modifiersStr.length > 0) {
          doc.fontSize(11).text(`${modifiersStr.trim()}`, { align: 'left' });
          // move down is extra since its at fontsize 11 right now
          doc.moveDown(1);
        }

        // move down between each menu item
        doc.moveDown(0.75);
      });

      // Add spacing between sections
      doc.moveDown(1.5);
    });

    doc.moveDown(1.5);
    menuDisclaimers?.forEach(disclaimer => {
      doc.fontSize(8).text(`${disclaimer.message.trim()}`, { align: 'left' });
    });

    doc.end();
  });
};

export const createMenuDoc_docx = async (
  menuDisclaimers: MenuDisclaimerInterface[],
  sections: GetMenuSectionsForMenuDetailsInterface[],
  prixMenu = false,
) => {
  const paragraphs = [];

  sections.forEach(section => {
    // ignore hidden sections
    if (section.isHidden === true) {
      return;
    }

    // Add section name
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: section.sectionName.toUpperCase().trim(),
            bold: true,
            size: 24, // This will set the font size to 12pt as 1pt = 2 size units
            font: {
              name: 'Arial',
            },
          }),
        ],
      }),
    );

    // Add section message with spacing after
    if (section.message) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: section.message.trim(),
              size: 24,
              italic: true,
              font: {
                name: 'Arial',
              },
            }),
          ],
        }),
      );
    }

    // Add an empty paragraph for a blank line
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: ' ', // need to add a blank white space on line in order to override the default helvetica size 11
            size: 24,
            font: {
              name: 'Arial',
            },
          }),
        ],
      }),
    );

    // handle items
    section.items.forEach(item => {
      // ignore hidden items
      if (item.isHidden === true) {
        return;
      }

      // Add item name
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: item.name.trim(),
              size: 24,
              bold: true,
              font: {
                name: 'Arial',
              },
            }),
          ],
        }),
      );

      // Add item description
      if (item.description) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: item.description.trim(),
                size: 24,
                font: {
                  name: 'Arial',
                },
              }),
            ],
          }),
        );
      }

      // handle sizes
      if (item.allItemSizes.length > 1) {
        // if multiple sizes
        let sizeStr = '';
        // first do base item size
        const formattedBasePrice = item.baseItemSize.priceOverride
          ? `${item.baseItemSize.priceOverride.trim()}`
          : `$${(item.baseItemSize.price / 100).toFixed(2).replace(/\.00$/, '')}`;

        if (formattedBasePrice !== 'prix' && !prixMenu) {
          sizeStr += `${item.baseItemSize.label.trim()} - ${formattedBasePrice}`;
        } else {
          sizeStr += `${item.baseItemSize.label.trim()}`;
        }

        // then loop through remaining sizes
        item.allItemSizes.forEach(size => {
          if (size.label === item.baseItemSize.label && size.price === item.baseItemSize.price) {
            return;
          }
          const formattedSizePrice = size.priceOverride ? `${size.priceOverride.trim()}` : `$${(size.price / 100).toFixed(2).replace(/\.00$/, '')}`;
          if (formattedSizePrice !== 'prix' && !prixMenu) {
            sizeStr += ` | ${size?.label.trim()} - ${formattedSizePrice}`;
          } else {
            sizeStr += ` | ${size?.label.trim()}`;
          }
        });
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: sizeStr,
                size: 24,
                font: {
                  name: 'Arial',
                },
              }),
            ],
          }),
        );
      } else {
        // only one size, just add price
        // Add item price, hence dividing by 100 for dollar format)
        const formattedBasePrice = item.baseItemSize.priceOverride
          ? `${item.baseItemSize.priceOverride.trim()}`
          : `$${(item.baseItemSize.price / 100).toFixed(2).replace(/\.00$/, '')}`;

        if (formattedBasePrice !== 'prix' && !prixMenu) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${formattedBasePrice}`,
                  size: 24,
                  font: {
                    name: 'Arial',
                  },
                }),
              ],
            }),
          );
        }
      }

      let modifiersStr = '';
      item?.modifierGroups?.forEach(group => {
        group?.modifiers.forEach(modifier => {
          const formattedModifierPrice = `$${(modifier.price / 100).toFixed(2).replace(/\.00$/, '')}`;

          // only add modifiers to strings if they have a price, ignore modifiers with no price
          if (modifier?.price) {
            if (modifiersStr.length === 0) {
              // first modifier will not have a | pipe in the string
              modifiersStr += `Add ${modifier.name.trim()} + ${formattedModifierPrice}`;
            } else {
              // remaining modifiers will have a | pipe in the string
              modifiersStr += ` | Add ${modifier.name.trim()} + ${formattedModifierPrice}`;
            }
          }
        });
      });

      // if any modifiers exist for the item, then write them to the doc
      if (modifiersStr.length > 0) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: modifiersStr,
                size: 20,
                font: {
                  name: 'Arial',
                },
              }),
            ],
          }),
        );
      }

      // Add an empty paragraph for a blank line
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: ' ',
              size: 24,
              font: {
                name: 'Arial',
              },
            }),
          ],
        }),
      );
    });

    // Add an empty paragraph for a blank line
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: ' ',
            size: 24,
            font: {
              name: 'Arial',
            },
          }),
        ],
      }),
    );
  });

  // add menu disclaimers at bottom of docx file as small font
  menuDisclaimers?.forEach(disclaimer => {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: disclaimer.message.trim(),
            size: 16,
            font: {
              name: 'Arial',
            },
          }),
        ],
      }),
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  // Convert the document to a byte array
  const buffer = await Packer.toBuffer(doc);
  return buffer;
};

export const uploadFileToGoogleCloud = async function (buffer, fileName) {
  return await new Promise((resolve, reject) => {
    const filePath = `files/${fileName}`;
    // Create a new blob in the bucket and upload the file data.
    const bucket = getBucket();
    const blob = bucket.file(filePath);
    const blobStream = blob.createWriteStream({
      resumable: false,
    });
    blobStream.on('error', err => {
      logger.error(`${ERRORS.UPLOAD}: ${filePath}. ${err}`);
      reject(err);
    });
    blobStream.on('finish', async () => {
      try {
        // Make the file public
        await bucket.file(filePath).makePublic();
      } catch (err) {
        logger.error(`${ERRORS.PUBLIC}: Uploaded file to Cloud Storage successfully: ${filePath}, but public access is denied!`);
        reject(err);
      }
      logger.info(`Uploaded file to Cloud Storage successfully: ${filePath}.`);

      resolve(true);
    });
    blobStream.end(buffer);
  });
};

export const buildFileURL = (filename: string): string => {
  return APP_CONFIG.FILE_HOSTING_URL?.endsWith('/') ? `${APP_CONFIG.FILE_HOSTING_URL}${filename}` : `${APP_CONFIG.FILE_HOSTING_URL}/${filename}`;
};

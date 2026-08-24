import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import sgMail from '@sendgrid/mail';
import { SENDGRID_API, ONBOARDING } from '@configs/config';

interface SendGridEmailInterface {
  to: string;
  from: string;
  subject: string;
  html: string;
}

const sendEmail = async (email: SendGridEmailInterface) => {
  try {
    await new Promise((resolve, reject) => {
      sgMail.setApiKey(SENDGRID_API.SENDGRID_API_KEY);

      sgMail
        .send(email)
        .catch(err => {
          reject(err);
        })
        .then(data => {
          resolve(data);
        });
    });
  } catch (err) {
    logger.error(`Error occurred while attempting to send email using send grind. - ${err}`);
    throw new HttpException(
      500,
      getErrorPayload(
        InternalErrorCode.runtimeError,
        `Error occurred while attempting to send email using send grind. Refer to the logs for more detail.`,
      ),
    );
  }
};

export const sendResetPasswordEmail = async ({ email: toEmail, newPassword, firstName }) => {
  try {
    const msg = {
      to: toEmail,
      from: SENDGRID_API.TAPTAB_CS_EMAIL,
      subject: 'TapTab Reset Password',
      html:
        'Hi ' +
        firstName +
        ',<br><br>\
            Please login using ' +
        newPassword.bold() +
        ' as a temporary password.<br><br> \
            Best,<br> \
            Team TapTab',
    };

    await sendEmail(msg);
  } catch (err) {
    logger.error(`Error occurred while attempting to send email to user to reset password - ${err}`);
    throw new HttpException(
      500,
      getErrorPayload(
        InternalErrorCode.runtimeError,
        `Error occurred while attempting to send email to user to reset password. Refer to the logs for more detail.`,
      ),
    );
  }
};

export const sendEmailOnboarding = async (email: string, passCode: string, firstName: string, managerID: number) => {
  try {
    const msg = {
      to: email,
      from: SENDGRID_API.TAPTAB_CS_EMAIL,
      subject: 'TapTab Account Verification',
      html: `Hi
        ${firstName},<br><br>\
            Please click on this link
            ${ONBOARDING.ONBOARDING_VERIFY_EMAIL_URL}/?code=${passCode}&id=${managerID}
         in order to verify your TapTab account.<br><br> \
         Welcome aboard!<br> \
            Team TapTab`,
    };

    await sendEmail(msg);
  } catch (err) {
    logger.error(`Error occurred while attempting to send email to user to verify email - ${err}`);
    throw new HttpException(
      500,
      getErrorPayload(
        InternalErrorCode.runtimeError,
        `Error occurred while attempting to send email to user to verify email. Refer to the logs for more detail.`,
      ),
    );
  }
};

export const sendCheckoutCompletionEmail = async (customerName: string, email: string, successUrl: string, existingUser: boolean) => {
  try {
    let msg;
    if (existingUser) {
      msg = {
        to: email,
        from: SENDGRID_API.TAPTAB_CS_EMAIL,
        subject: 'TapTab Purchase Confirmation',
        html: `${customerName ? 'Hi ' + customerName : 'Thanks from TapTab'},<br><br>\
            We appreciate your continued business with us at TapTab and are excited to help you create another awesome menu at your other restaurant.
            You can get started at ${successUrl}.<br><br> \
         Thanks!<br> \
            TapTab Team`,
      };
    } else {
      msg = {
        to: email,
        from: SENDGRID_API.TAPTAB_CS_EMAIL,
        subject: 'Welcome to TapTab!',
        html: `${customerName ? 'Hi ' + customerName : 'Thanks for joining TapTab'},<br><br>\
            Thank you for purchasing a subscription with TapTab! If you haven't already, please sign up for an account at
            ${successUrl}.<br><br> \
         Welcome Aboard!<br> \
            TapTab Team`,
      };
    }

    await sendEmail(msg);
  } catch (err) {
    logger.error(`Error occurred while attempting to send email to user after checkout completion. - ${err}`);
    throw new HttpException(
      500,
      getErrorPayload(
        InternalErrorCode.runtimeError,
        `Error occurred while attempting to send email to user after checkout completion. Refer to the logs for more detail.`,
      ),
    );
  }
};

import bcrypt from "bcrypt";
import redis from "../configs/redis.config";
import otpGenerate from "otp-generator";
import { StatusCodes } from "http-status-codes";
import { Resend } from "resend";
import { ResendOtpDTO, VerifyOtpDTO } from "../dtos";
import { generateResetToken } from "./auth.service";

export const generateOtpService = async (key: string) => {
  const otp = otpGenerate.generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  const salt = bcrypt.genSaltSync(10);
  const hashOtp = bcrypt.hashSync(otp, salt);
  const ttlSeconds = 60;
  await redis.set(
    key,
    JSON.stringify({
      otp: hashOtp,
      retry: 0,
      expiresAt: Date.now() + ttlSeconds * 1000,
    }),
    "EX",
    ttlSeconds
  );
  return otp;
};

export const sendToEmail = async (
  email: string,
  title: string,
  html: string
) => {
  const resend = new Resend(process.env.RESEND_KEY);
  const { data, error } = await resend.emails.send({
    from: "Splitwise <onboarding@resend.dev>",
    to: email,
    subject: title,
    html: html,
  });
  if (error) {
    throw {
      status: StatusCodes.BAD_REQUEST,
      message: error,
    };
  }
  return data;
};

export const sendOtpRegisterService = async (email: string) => {
  const otp = await generateOtpService(`otp:register:${email}`);
  const title = "Splitwise - Mã xác nhận";
  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Mã xác nhận đăng ký tài khoản</title>
</head>
<body style="font-family: Arial, sans-serif;">
    <h2>Mã xác nhận đăng ký tài khoản</h2>
    <p>Mã xác nhận để xác minh email của bạn và hoàn tất quy trình đăng ký tài khoản</p>

    <p>Mã xác nhận: <strong style="font-size: 18px; background-color: #f0f0f0; padding: 5px;">${otp}</strong></p>

    <p>Mã xác nhận này có hiệu lực 1 phút kể từ thời điểm email này được gửi. Vui lòng không chia sẻ nó cho bất kỳ ai.</p>

    <p>Nếu bạn không yêu cầu đăng ký tài khoản này hoặc bạn không thực hiện hành động này, vui lòng bỏ qua email này.</p>

    <p>INếu bạn gặp bất kỳ vấn đề hoặc cần hỗ trợ, vui lòng liên hệ với chúng tôi qua email tại <a href="mailto:splitwise@example.com">splitwise@example.com</a>.</p>

    <p>Cảm ơn.</p>

    <p>Trân trọng,</p>
    <p><strong>Nhóm hỗ trợ của chúng tôi tại Splitwise</strong></p>

</body>
</html>
`;
  await sendToEmail(email, title, html);
  return true;
};

export const sendOtpResetService = async (email: string) => {
  const otp = await generateOtpService(`otp:reset:${email}`);
  const title = "Splitwise - Mã xác nhận";
  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Mã xác nhận đặt lại mật khẩu</title>
</head>
<body style="font-family: Arial, sans-serif;">
    <h2>Mã xác nhận đặt lại mật khẩu</h2>
    <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>

    <p>Mã xác nhận của bạn là: 
        <strong style="font-size: 18px; background-color: #f0f0f0; padding: 5px;">
            ${otp}
        </strong>
    </p>

    <p>Mã xác nhận này có hiệu lực trong 1 phút kể từ thời điểm email được gửi. Vui lòng không chia sẻ cho bất kỳ ai.</p>

    <p>Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể bỏ qua email này và mật khẩu của bạn sẽ không thay đổi.</p>

    <p>Nếu bạn gặp vấn đề hoặc cần hỗ trợ, vui lòng liên hệ với chúng tôi qua email tại 
        <a href="mailto:splitwise@example.com">splitwise@example.com</a>.
    </p>

    <p>Cảm ơn.</p>

    <p>Trân trọng,</p>
    <p><strong>Đội ngũ hỗ trợ Splitwise</strong></p>
</body>
</html>
`;
  await sendToEmail(email, title, html);

  return true;
};

export const resendOtpService = async (data: ResendOtpDTO) => {
  const { email, options } = data;
  const key = `otp:resend:${email}`;
  const MAX_RESEND = 3;
  const TTL_SECONDS = 10 * 60; // 10 phút

  // Atomic increment
  const resendCount = await redis.incr(key);

  // Lần đầu → set TTL
  if (resendCount === 1) {
    await redis.expire(key, TTL_SECONDS);
  }

  if (resendCount > MAX_RESEND) {
    throw {
      status: StatusCodes.TOO_MANY_REQUESTS,
      message: "Quá nhiều lần gửi lại. Vui lòng thử lại sau.",
    };
  }
  await redis.del(`otp:${options}:${email}`);
  options === "register"
    ? await sendOtpRegisterService(email)
    : await sendOtpResetService(email);
  return true;
};

export const verifyOtpService = async (data: VerifyOtpDTO) => {
  const { email, otp, options } = data;
  const isOtp = await redis.get(`otp:${options}:${email}`);
  if (!isOtp)
    throw {
      status: StatusCodes.UNAUTHORIZED,
      message: "OTP đã hết hạn",
    };
  const otpData = JSON.parse(isOtp);
  const isCompareOtp = await bcrypt.compare(otp, otpData.otp);
  if (!isCompareOtp) {
    otpData.retry += 1;

    // lưu lại số lần nhập sai (không reset TTL)
    await redis.set(`otp:verify:${email}`, JSON.stringify(otpData), "KEEPTTL");

    if (otpData.retry >= 5) {
      await redis.del(`otp:verify:${email}`);
      throw {
        status: StatusCodes.TOO_MANY_REQUESTS,
        message: "Quá nhiều lần thử",
      };
    }

    throw {
      status: StatusCodes.UNAUTHORIZED,
      messsage: "OTP incorrect",
    };
  }
  await redis.del(`otp:${options}:${email}`);
  return true;
};

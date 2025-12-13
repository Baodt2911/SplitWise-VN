import bcrypt from "bcrypt";
import redis from "../configs/redis.config";
import otpGenerate from "otp-generator";
import { StatusCodes } from "http-status-codes";
import twilio from "twilio";
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
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



export const sendOtpRegisterService = async (phone: string) => {
  const otp = await generateOtpService(`otp:register:${phone}`);
  console.log(otp);

  // await client.messages.create({
  //   body: `[SplitWise VN] Your OTP code is ${otp}.`,
  //   from: process.env.TWILIO_PHONE, // Số Twilio
  //   to: `+84${phone}`, // Số người nhận, bắt đầu bằng +84
  // });
  return true;
};

export const sendOtpLoginService = async (phone: string) => {
  const otp = await generateOtpService(`otp:login:${phone}`);
  return true;
};

export const sendOtpEmailService = async (email: string) => {
  const otp = await generateOtpService(`otp:email:${email}`);
  return true;
};

export const sendOtpResetService = async (phone: string) => {
  const otp = await generateOtpService(`otp:reset:${phone}`);
  return true;
};

export const resendOtpRegisterService = async (phone: string) => {
  const key = `otp:resend:${phone}`;
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
      message: "Too many resend attempts. Please try again later.",
    };
  }
  await redis.del(`otp:register:${phone}`);
  await sendOtpRegisterService(phone);
  return true;
};

export const verifyOtpRegisterService = async (data: {
  phone: string;
  otp: string;
}) => {
  const isOtp = await redis.get(`otp:register:${data.phone}`);
  if (!isOtp)
    throw {
      status: StatusCodes.UNAUTHORIZED,
      message: "OTP expired",
    };
  const otpData = JSON.parse(isOtp);
  const isCompareOtp = await bcrypt.compare(data.otp, otpData.otp);
  if (!isCompareOtp) {
    otpData.retry += 1;

    // lưu lại số lần nhập sai (không reset TTL)
    await redis.set(
      `otp:verify:${data.phone}`,
      JSON.stringify(otpData),
      "KEEPTTL"
    );

    if (otpData.retry >= 5) {
      await redis.del(`otp:verify:${data.phone}`);
      throw {
        status: StatusCodes.TOO_MANY_REQUESTS,
        message: "Too many attempts",
      };
    }

    throw {
      status: StatusCodes.UNAUTHORIZED,
      messsage: "OTP incorrect",
    };
  }
  console.log("Đã verify");

  await redis.del(`otp:register:${data.phone}`);

  return true;
};

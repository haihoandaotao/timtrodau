/** Trừu tượng hóa nhà cung cấp gửi OTP (SMS). Cho phép swap mock/eSMS/Twilio/ZNS. */
export const OTP_PROVIDER = Symbol('OTP_PROVIDER');

export interface OtpProvider {
  /** Gửi mã OTP tới số điện thoại. Trả về true nếu gửi thành công. */
  send(phone: string, code: string): Promise<boolean>;
}

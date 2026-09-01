export default function PolicyLinksText({ className = "" }) {
  const linkClass =
    "text-teal-300 underline underline-offset-2 hover:text-teal-200";

  return (
    <p className={`text-sm leading-relaxed text-slate-400 ${className}`.trim()}>
      การเข้าสู่ระบบและการใช้งานถือว่าคุณยอมรับ{" "}
      <a
        href="/terms"
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        ข้อกำหนดการใช้บริการ
      </a>{" "}
      และ{" "}
      <a
        href="/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        นโยบายความเป็นส่วนตัว
      </a>
    </p>
  );
}

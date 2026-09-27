import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Smartphone } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    const url = window.location.href;
    setCurrentUrl(url);

    QRCode.toDataURL(url, {
      width: 480,
      margin: 2,
      color: {
        dark: '#18181b',
        light: '#ffffff',
      },
    })
      .then((dataUri) => setQrDataUrl(dataUri))
      .catch((err) => console.error(err));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white border-3 border-zinc-900 rounded-3xl p-6 sm:p-8 shadow-[6px_6px_0px_#18181b] text-center text-zinc-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 border-2 border-zinc-900 text-zinc-900 transition-all shadow-[1.5px_1.5px_0px_#18181b] active:translate-x-[1px] active:translate-y-[1px]"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center justify-center gap-1.5 mb-1 text-zinc-600 font-doodle font-bold text-sm">
          <Smartphone className="w-4 h-4 text-zinc-900" />
          <span>수업용 QR 코드 (학생 스마트폰 접속)</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-pen font-bold text-zinc-950 mb-1">
          카메라로 QR코드를 스캔하세요!
        </h2>
        <p className="text-zinc-600 font-doodle text-xs sm:text-sm mb-4">
          별도 설치 없이 웹 브라우저에서 바로 플레이합니다.
        </p>

        {/* QR Code Container */}
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-white rounded-2xl border-3 border-zinc-900 shadow-[4px_4px_0px_#18181b]">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="접속용 QR 코드"
                className="w-52 h-52 sm:w-64 sm:h-64 object-contain"
              />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-zinc-400 font-doodle text-sm">
                QR 코드 생성 중...
              </div>
            )}
          </div>
        </div>

        {/* Student Steps Guide */}
        <div className="grid grid-cols-3 gap-2 bg-zinc-50 border-2 border-zinc-900 rounded-xl p-3 mb-4 text-center shadow-[2px_2px_0px_#18181b]">
          <div>
            <span className="w-5 h-5 rounded-full bg-zinc-900 text-white font-doodle font-bold text-xs inline-flex items-center justify-center mb-1">
              1
            </span>
            <p className="text-xs font-doodle font-bold text-zinc-900">카메라 스캔</p>
            <p className="text-[10px] text-zinc-500 font-doodle">QR 인식</p>
          </div>
          <div>
            <span className="w-5 h-5 rounded-full bg-zinc-900 text-white font-doodle font-bold text-xs inline-flex items-center justify-center mb-1">
              2
            </span>
            <p className="text-xs font-doodle font-bold text-zinc-900">학번/이름 입력</p>
            <p className="text-[10px] text-zinc-500 font-doodle">30901 김민수</p>
          </div>
          <div>
            <span className="w-5 h-5 rounded-full bg-yellow-400 text-zinc-950 font-doodle font-bold text-xs inline-flex items-center justify-center mb-1 border border-zinc-900">
              3
            </span>
            <p className="text-xs font-doodle font-bold text-zinc-900">똥피하기 시작</p>
            <p className="text-[10px] text-zinc-500 font-doodle">정답 먹기!</p>
          </div>
        </div>

        {/* URL Copy Button */}
        <div className="flex items-center gap-2 bg-zinc-50 border-2 border-zinc-900 rounded-xl p-1.5 pl-3 shadow-[2px_2px_0px_#18181b]">
          <span className="text-xs text-zinc-600 truncate flex-1 font-mono text-left">
            {currentUrl}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-doodle font-bold transition-all active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '복사됨' : '주소 복사'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

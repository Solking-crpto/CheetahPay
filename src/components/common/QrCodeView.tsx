import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, Download, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface QrCodeViewProps {
  value: string;
  size?: number;
  label?: string;
  subLabel?: string;
}

export const QrCodeView: React.FC<QrCodeViewProps> = ({
  value,
  size = 220,
  label,
  subLabel,
}) => {
  const [svgString, setSvgString] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setTimeout(() => setSvgString(''), 0);
      return;
    }

    let isCurrent = true;
    QRCode.toString(value, {
      type: 'svg',
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0B0D10',
        light: '#FFFFFF',
      },
      width: size,
    })
      .then((svg) => {
        if (isCurrent) {
          setSvgString(svg);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (isCurrent) {
          console.error('Failed to generate QR code', err);
          setError('Unable to render QR code for this payload');
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [value, size]);

  const handleCopy = () => {
    if (!value) return;
    void navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.info('Copied to clipboard');
  };

  const handleDownload = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cheetahpay-qr-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('QR code SVG downloaded');
  };

  return (
    <div className="flex flex-col items-center p-4 bg-[#12151A] border border-[#2A3038] rounded-lg">
      {label && <h4 className="text-[11px] font-medium uppercase tracking-wider text-[#737B87] mb-1">{label}</h4>}
      {subLabel && <p className="text-[10px] text-[#737B87] mb-3 text-center">{subLabel}</p>}

      <div className="relative p-2.5 bg-white rounded-md flex items-center justify-center">
        {error ? (
          <div className="w-48 h-48 flex flex-col items-center justify-center text-red-400 text-xs p-4 text-center">
            <AlertCircle className="w-6 h-6 mb-2" />
            <span>{error}</span>
          </div>
        ) : svgString ? (
          <div
            className="w-full h-full flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: svgString }}
          />
        ) : (
          <div className="w-48 h-48 flex items-center justify-center text-[#737B87] text-xs">
            Rendering QR...
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3.5">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[#191D23] hover:bg-[#2A3038] text-[#F3F4F6] border border-[#2A3038] transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[#737B87]" />}
          <span>{copied ? 'Copied' : 'Copy URI'}</span>
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[#191D23] hover:bg-[#2A3038] text-[#F3F4F6] border border-[#2A3038] transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-[#737B87]" />
          <span>Download</span>
        </button>
      </div>
    </div>
  );
};

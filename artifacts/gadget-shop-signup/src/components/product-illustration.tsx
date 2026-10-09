import type { ProductIllustrationKind } from '@/data/product-catalog';

type ProductIllustrationProps = {
  kind: ProductIllustrationKind;
  name: string;
};

function PhoneBack({ x = 51, y = 30, color = '#183148', cameras = 3 }: { x?: number; y?: number; color?: string; cameras?: number }) {
  return (
    <g>
      <rect x={x} y={y} width="58" height="102" rx="12" fill={color} />
      <rect x={x + 3} y={y + 3} width="52" height="96" rx="10" fill="#294a63" />
      {Array.from({ length: cameras }, (_, index) => (
        <g key={index}>
          <circle cx={x + 13} cy={y + 16 + index * 17} r="5.5" fill="#102235" />
          <circle cx={x + 13} cy={y + 16 + index * 17} r="2.4" fill="#7db6d1" />
        </g>
      ))}
      <circle cx={x + 34} cy={y + 18} r="3" fill="#c4d8df" />
      <path d={`M${x + 28} ${y + 62}h18`} stroke="#7c9bae" strokeWidth="2" strokeLinecap="round" opacity=".7" />
    </g>
  );
}

export function ProductIllustration({ kind, name }: ProductIllustrationProps) {
  return (
    <svg className="h-[104px] w-[94px] shrink-0 drop-shadow-[0_7px_7px_rgba(30,61,78,.18)] sm:h-[118px] sm:w-[112px]" viewBox="0 0 160 160" role="img" aria-label={`Illustrative image of ${name}; not an exact product photo`}>
      <circle cx="80" cy="80" r="66" fill="#ffffff" opacity=".38" />
      {kind === 'cable' && (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M52 91c-12 0-18-8-18-18s7-16 17-16h56c11 0 19 8 19 19s-8 18-19 18H67c-8 0-13 6-13 13s6 14 14 14h35" stroke="#eaf6f7" strokeWidth="10" />
          <path d="M52 91c-12 0-18-8-18-18s7-16 17-16h56c11 0 19 8 19 19s-8 18-19 18H67c-8 0-13 6-13 13s6 14 14 14h35" stroke="#688ca0" strokeWidth="3" />
          <rect x="98" y="112" width="17" height="11" rx="4" fill="#173247" />
          <rect x="42" y="50" width="19" height="12" rx="4" fill="#173247" />
        </g>
      )}
      {kind === 'charger' && (
        <g>
          <rect x="52" y="41" width="56" height="77" rx="14" fill="#f8fcff" stroke="#83aaba" strokeWidth="3" />
          <rect x="59" y="51" width="42" height="53" rx="9" fill="#d9e9ee" />
          <rect x="69" y="31" width="7" height="18" rx="3" fill="#839ba9" />
          <rect x="89" y="31" width="7" height="18" rx="3" fill="#839ba9" />
          <rect x="74" y="105" width="12" height="4" rx="2" fill="#173247" />
          <path d="M67 69h27" stroke="#6d9daf" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      {kind === 'earphones' && (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M79 62v36c0 12-6 19-15 24m17-60v31c0 13 7 22 18 29" stroke="#e8f3f7" strokeWidth="7" />
          <path d="M79 62v36c0 12-6 19-15 24m17-60v31c0 13 7 22 18 29" stroke="#68899a" strokeWidth="2.5" />
          <path d="M57 56c0-9 6-15 14-15s13 6 13 15v12H57z" fill="#f9fdff" stroke="#819ead" strokeWidth="3" />
          <path d="M77 50c0-9 6-15 14-15s13 6 13 15v12H77z" fill="#f9fdff" stroke="#819ead" strokeWidth="3" />
          <rect x="59" y="116" width="12" height="10" rx="3" fill="#19344a" />
          <rect x="93" y="124" width="12" height="10" rx="3" fill="#19344a" />
        </g>
      )}
      {kind === 'tag' && (
        <g>
          <rect x="48" y="42" width="64" height="77" rx="20" fill="#f5fbfc" stroke="#789dad" strokeWidth="3" transform="rotate(-8 80 80)" />
          <circle cx="82" cy="78" r="18" fill="#deedf1" stroke="#6e95a6" strokeWidth="3" />
          <circle cx="82" cy="78" r="7" fill="#79a9b7" />
          <path d="M83 60c10 0 18 8 18 18" fill="none" stroke="#adcbd1" strokeWidth="3" strokeLinecap="round" />
          <circle cx="96" cy="107" r="3" fill="#375e70" />
        </g>
      )}
      {kind === 'buds' && (
        <g>
          <path d="M48 83V67c0-8 6-14 14-14s14 6 14 14v11" fill="#f8fcff" stroke="#7f9eac" strokeWidth="4" strokeLinecap="round" />
          <path d="M84 78V64c0-8 6-14 14-14s14 6 14 14v19" fill="#f8fcff" stroke="#7f9eac" strokeWidth="4" strokeLinecap="round" />
          <rect x="36" y="82" width="88" height="42" rx="20" fill="#f8fcff" stroke="#7f9eac" strokeWidth="3" />
          <path d="M40 98c8-8 17-12 40-12s32 4 40 12" fill="none" stroke="#c7dce2" strokeWidth="3" />
          <circle cx="80" cy="108" r="3" fill="#5e8999" />
        </g>
      )}
      {kind === 'band' && (
        <g>
          <rect x="65" y="26" width="30" height="108" rx="14" fill="#224057" />
          <rect x="47" y="56" width="66" height="52" rx="17" fill="#f9fdff" stroke="#7f9ead" strokeWidth="4" />
          <rect x="54" y="63" width="52" height="38" rx="11" fill="#315b70" />
          <circle cx="80" cy="82" r="12" fill="#a8d7d7" />
          <path d="M80 72v10l7 5" fill="none" stroke="#234457" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      {kind === 'phone' && <PhoneBack color="#315f7c" cameras={2} />}
      {kind === 'phone5g' && <PhoneBack x={48} y={27} color="#264b5a" cameras={3} />}
      {kind === 'tablet' && (
        <g>
          <rect x="35" y="30" width="90" height="100" rx="12" fill="#23384b" />
          <rect x="41" y="36" width="78" height="88" rx="8" fill="#d8eef1" />
          <path d="M48 101c12-19 20-24 31-13s18 7 32-13v40H48z" fill="#76aeb9" />
          <path d="M49 95c13-9 19-21 30-15 11 5 18 4 31-9" fill="none" stroke="#ffffff" strokeWidth="3" />
          <path d="M128 42l5 2-27 77-5-2z" fill="#ecf5f7" stroke="#8ba6b0" strokeWidth="2" />
        </g>
      )}
      {kind === 'sfe' && (
        <g>
          <PhoneBack x={35} y={35} color="#586d7c" cameras={3} />
          <rect x="77" y="28" width="48" height="104" rx="11" fill="#1c2d40" stroke="#6b8795" strokeWidth="3" />
          <rect x="82" y="36" width="38" height="86" rx="7" fill="#cfe6ec" />
          <path d="M86 104c8-18 13-20 19-10 5 8 9 8 15-3v27H86z" fill="#72a6b4" />
        </g>
      )}
      {kind === 'ultra' && (
        <g>
          <PhoneBack x={43} y={28} color="#1b2e43" cameras={4} />
          <rect x="119" y="52" width="5" height="71" rx="2.5" fill="#eef4f6" stroke="#879da6" strokeWidth="1.5" />
          <circle cx="59" cy="48" r="2.5" fill="#e9c889" />
        </g>
      )}
      {kind === 'fold' && (
        <g>
          <path d="M43 40c0-7 5-12 12-12h25v101H55c-7 0-12-5-12-12z" fill="#23394e" />
          <path d="M80 28h25c7 0 12 5 12 12v77c0 7-5 12-12 12H80z" fill="#183045" />
          <path d="M49 43c0-4 3-7 7-7h18v91H56c-4 0-7-3-7-7z" fill="#cce8eb" />
          <path d="M86 36h18c4 0 7 3 7 7v77c0 4-3 7-7 7H86z" fill="#dbf0f1" />
          <path d="M79 29v100" stroke="#758f9f" strokeWidth="3" />
          <path d="M52 104c8-10 14-11 21-2m16-12c8-12 14-10 20-3" fill="none" stroke="#76aeb8" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

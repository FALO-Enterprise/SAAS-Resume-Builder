/* The Resumax AI wordmark: a sheet with one corner cut, beside the name. The
   mark is the product. Used by the header, the footer and the editor sidebar. */

const Logo = () => (
  <span className="inline-flex items-center gap-2.5">
    <svg aria-hidden width="26" height="30" viewBox="0 0 26 30" fill="none">
      <path d="M1 1h16l8 8v20H1V1Z" className="fill-lp-ink" />
      <path d="M17 1v8h8" className="stroke-lp-paper" strokeWidth="1.5" />
      <path
        d="M6.5 15.5h13M6.5 20h13M6.5 24.500h8"
        className="stroke-lp-mat"
        strokeWidth="1.8"
      />
    </svg>
    <span className="text-[19px] font-bold tracking-[-0.03em] text-lp-ink">
      Resumax AI
    </span>
  </span>
);

export default Logo;

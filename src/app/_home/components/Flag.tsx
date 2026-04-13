import { DIM } from "../constants";

export function Flag({ code, w = 20 }: { code: string | null; w?: number }) {
  return code ? (
    <img
      src={`https://flagcdn.com/w${w}/${code}.png`}
      alt=""
      style={{ width: w, height: Math.round(w * 0.67), borderRadius: 2, objectFit: "cover" }}
      loading="lazy"
    />
  ) : (
    <div
      style={{
        width: w,
        height: Math.round(w * 0.67),
        borderRadius: 2,
        background: "rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ fontSize: 6, color: DIM }}>?</span>
    </div>
  );
}

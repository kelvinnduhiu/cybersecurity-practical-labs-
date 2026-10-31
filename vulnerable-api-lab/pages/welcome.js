import { useState } from "react";
import { useRouter } from "next/router";

export default function Welcome() {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    const r = await fetch("/api/gate/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });
    if (r.ok) router.push("/");
    else setErr("Wrong code — ask your instructor.");
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", fontFamily: "system-ui, sans-serif" }}>
      <h2>🔒 Vulnerable API Lab</h2>
      <p>Enter the class access code your instructor gave you.</p>
      <form onSubmit={submit}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Access code"
          style={{ padding: 8, width: "100%", marginBottom: 8 }}
        />
        <button type="submit" style={{ padding: "8px 16px" }}>Enter lab</button>
      </form>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
    </div>
  );
}

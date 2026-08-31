import React, { useMemo, useState } from "react";
import {
  generateCertificateSVG,
  generateTranscriptText,
  type MasteryCertificate,
  verifyCertificateIntegrity,
} from "../../curriculum";

export interface CertificateVerificationModalProps {
  readonly certificate?: MasteryCertificate;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onVerifyHash?: (hash: string) => boolean;
}

const DEFAULT_SAMPLE_CERTIFICATE: MasteryCertificate = {
  certificateId: "CERT-COURSE-MLFLASHATTENTIONSRAMTILING-A0324F22",
  certificateType: "course_completion",
  credentialId: "ml_flashattention_sram_tiling",
  title: "Certificate of Mastery: FlashAttention & SRAM Tiling",
  subtitle: "University-Grade Masterclass Depth",
  studentName: "Linus Torvalds",
  completionTimestamp: 1700000000000,
  issueDate: "November 14, 2023",
  masteryScore: 0.98,
  totalStudyHours: 2.5,
  issuer: "DSA & ML Systems Masterclass Academy",
  verificationHash: "a0324f2236dc06040e1e4b777bb4737374bde173c3f3b743affb1b00c23081a0",
  metadata: {
    trackId: "machine-learning",
    topicsCount: 1,
    checkpointsPassed: 10,
    socraticScoreAverage: 98,
  },
};

export const CertificateVerificationModal: React.FC<CertificateVerificationModalProps> = ({
  certificate = DEFAULT_SAMPLE_CERTIFICATE,
  isOpen,
  onClose,
  onVerifyHash,
}) => {
  const [activeTab, setActiveTab] = useState<"artwork" | "transcript" | "verify">("artwork");
  const [inputHash, setInputHash] = useState(certificate.verificationHash);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  const activeCert = certificate || DEFAULT_SAMPLE_CERTIFICATE;

  // SVG Certificate Vector String
  const certificateSVG = useMemo(() => {
    return generateCertificateSVG(activeCert);
  }, [activeCert]);

  // Academic Transcript String
  const transcriptText = useMemo(() => {
    return generateTranscriptText(activeCert);
  }, [activeCert]);

  // Cryptographic Verification Status
  const verificationResult = useMemo(() => {
    if (!inputHash.trim()) return null;
    const isAuthentic = verifyCertificateIntegrity(activeCert);
    const hashMatches =
      inputHash.trim().toLowerCase() === activeCert.verificationHash.toLowerCase();
    const customResult = onVerifyHash ? onVerifyHash(inputHash.trim()) : true;
    return isAuthentic && hashMatches && customResult;
  }, [activeCert, inputHash, onVerifyHash]);

  if (!isOpen) return null;

  const handleCopyTranscript = () => {
    navigator.clipboard?.writeText(transcriptText);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  const handleDownloadSVG = () => {
    const blob = new Blob([certificateSVG], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeCert.certificateId}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(2, 6, 23, 0.85)",
        backdropFilter: "blur(8px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#f8fafc",
      }}
    >
      <div
        style={{
          width: "min(1000px, 95vw)",
          maxHeight: "92vh",
          backgroundColor: "#020617",
          border: "1px solid #1e293b",
          borderRadius: "14px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #1e293b",
            backgroundColor: "#090d16",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>📜</span>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: "bold", color: "#fbbf24", margin: 0 }}>
                Verified Academic Credential & Cryptographic Certificate
              </h2>
              <p
                style={{
                  margin: "2px 0 0 0",
                  fontSize: "11px",
                  color: "#94a3b8",
                  fontFamily: "monospace",
                }}
              >
                ID: {activeCert.certificateId}
              </p>
            </div>
          </div>

          {/* Navigation Tabs & Close */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                display: "flex",
                backgroundColor: "#0f172a",
                borderRadius: "6px",
                padding: "2px",
              }}
            >
              <button
                onClick={() => setActiveTab("artwork")}
                style={{
                  padding: "5px 12px",
                  fontSize: "12px",
                  border: "none",
                  borderRadius: "4px",
                  backgroundColor: activeTab === "artwork" ? "#1e293b" : "transparent",
                  color: activeTab === "artwork" ? "#fbbf24" : "#94a3b8",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Artwork
              </button>
              <button
                onClick={() => setActiveTab("transcript")}
                style={{
                  padding: "5px 12px",
                  fontSize: "12px",
                  border: "none",
                  borderRadius: "4px",
                  backgroundColor: activeTab === "transcript" ? "#1e293b" : "transparent",
                  color: activeTab === "transcript" ? "#38bdf8" : "#94a3b8",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Transcript
              </button>
              <button
                onClick={() => setActiveTab("verify")}
                style={{
                  padding: "5px 12px",
                  fontSize: "12px",
                  border: "none",
                  borderRadius: "4px",
                  backgroundColor: activeTab === "verify" ? "#1e293b" : "transparent",
                  color: activeTab === "verify" ? "#10b981" : "#94a3b8",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                SHA-256 Verifier
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                padding: "6px 12px",
                fontSize: "14px",
                backgroundColor: "transparent",
                color: "#94a3b8",
                border: "none",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Tab 1: Vector Certificate Artwork */}
          {activeTab === "artwork" && (
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxHeight: "560px",
                  borderRadius: "10px",
                  overflow: "hidden",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6)",
                  border: "1px solid #334155",
                }}
                dangerouslySetInnerHTML={{ __html: certificateSVG }}
              />

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={handleDownloadSVG}
                  style={{
                    padding: "8px 18px",
                    backgroundColor: "#0284c7",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>⬇️</span> Download SVG Certificate
                </button>
                <button
                  onClick={handleCopyTranscript}
                  style={{
                    padding: "8px 18px",
                    backgroundColor: "#1e293b",
                    color: "#cbd5e1",
                    border: "1px solid #334155",
                    borderRadius: "6px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {copiedTranscript ? "✓ Copied Transcript" : "Copy Markdown Transcript"}
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Academic Transcript */}
          {activeTab === "transcript" && (
            <div style={{ width: "100%", maxWidth: "800px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#38bdf8", margin: 0 }}>
                  Official Academic Transcript (Markdown)
                </h3>
                <button
                  onClick={handleCopyTranscript}
                  style={{
                    padding: "4px 12px",
                    fontSize: "11px",
                    backgroundColor: "#1e293b",
                    color: copiedTranscript ? "#10b981" : "#cbd5e1",
                    border: "1px solid #334155",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  {copiedTranscript ? "✓ Copied" : "Copy Transcript"}
                </button>
              </div>

              <pre
                style={{
                  backgroundColor: "#090d16",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  padding: "16px",
                  fontSize: "12px",
                  lineHeight: "1.6",
                  color: "#cbd5e1",
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  overflowX: "auto",
                }}
              >
                {transcriptText}
              </pre>
            </div>
          )}

          {/* Tab 3: Cryptographic SHA-256 Verifier */}
          {activeTab === "verify" && (
            <div
              style={{
                width: "100%",
                maxWidth: "720px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: "bold",
                    color: "#10b981",
                    margin: "0 0 4px 0",
                  }}
                >
                  🔐 Cryptographic SHA-256 Verification
                </h3>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                  Verify that this credential was officially signed by the Masterclass Academy and
                  has not been tampered with.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", color: "#cbd5e1", fontWeight: 600 }}>
                  Certificate SHA-256 Digest:
                </label>
                <input
                  type="text"
                  value={inputHash}
                  onChange={(e) => setInputHash(e.target.value)}
                  placeholder="Paste SHA-256 verification hash..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    backgroundColor: "#090d16",
                    border: "1px solid #334155",
                    borderRadius: "6px",
                    fontFamily: "monospace",
                    fontSize: "12px",
                    color: "#f8fafc",
                    outline: "none",
                  }}
                />
              </div>

              {/* Verification Status Banner */}
              {verificationResult !== null && (
                <div
                  style={{
                    padding: "14px 18px",
                    backgroundColor: verificationResult
                      ? "rgba(6, 78, 59, 0.4)"
                      : "rgba(69, 10, 10, 0.4)",
                    border: `1px solid ${verificationResult ? "#10b981" : "#ef4444"}`,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <span style={{ fontSize: "24px" }}>{verificationResult ? "✅" : "❌"}</span>
                  <div>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: verificationResult ? "#a7f3d0" : "#fca5a5",
                      }}
                    >
                      {verificationResult
                        ? "Authentic Credential Verified"
                        : "Verification Failed / Tampered Digest"}
                    </h4>
                    <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#cbd5e1" }}>
                      {verificationResult
                        ? `Cryptographic signature matches student '${activeCert.studentName}' and score ${Math.round(activeCert.masteryScore * 100)}%.`
                        : "The provided digest does not match the signed credential payload or data has been altered."}
                    </p>
                  </div>
                </div>
              )}

              {/* Cryptographic Details Table */}
              <div
                style={{
                  backgroundColor: "#090d16",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  padding: "14px 16px",
                  fontSize: "12px",
                }}
              >
                <div style={{ fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }}>
                  Signed Payload Parameters
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "140px 1fr",
                    gap: "6px",
                    color: "#94a3b8",
                  }}
                >
                  <span>Student Name:</span>
                  <span style={{ color: "#f8fafc", fontFamily: "monospace" }}>
                    {activeCert.studentName}
                  </span>
                  <span>Credential ID:</span>
                  <span style={{ color: "#f8fafc", fontFamily: "monospace" }}>
                    {activeCert.credentialId}
                  </span>
                  <span>Mastery Score:</span>
                  <span style={{ color: "#f8fafc", fontFamily: "monospace" }}>
                    {Math.round(activeCert.masteryScore * 100)}%
                  </span>
                  <span>Issued By:</span>
                  <span style={{ color: "#f8fafc", fontFamily: "monospace" }}>
                    {activeCert.issuer}
                  </span>
                  <span>Official SHA-256:</span>
                  <span
                    style={{ color: "#10b981", fontFamily: "monospace", wordBreak: "break-all" }}
                  >
                    {activeCert.verificationHash}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

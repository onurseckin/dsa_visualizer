import { describe, expect, it } from "bun:test";
import {
  generateCertificateSVG,
  generateTranscriptText,
  issueCourseCertificate,
  issueSpecializationCertificate,
  issueTrackCertificate,
  verifyCertificateHash,
} from "../certificateEngine";
import { createInitialProgressState, markPageCompleted } from "../courseProgress";

describe("Automated Course Completion & Certificate Verification Engine Tests", () => {
  const studentName = "Linus Torvalds";

  describe("1. Certificate Issuance (Courses, Tracks & Specializations)", () => {
    it("should issue valid individual course completion certificate", () => {
      let state = createInitialProgressState();
      state = markPageCompleted(state, "ml_flashattention_sram_tiling", 1);
      state = markPageCompleted(state, "ml_flashattention_sram_tiling", 2);

      const cert = issueCourseCertificate("ml_flashattention_sram_tiling", studentName, state, {
        customIssueTimestamp: 1700000000000,
      });

      expect(cert.certificateId).toContain("CERT-COURSE");
      expect(cert.certificateType).toBe("course_completion");
      expect(cert.studentName).toBe(studentName);
      expect(cert.credentialId).toBe("ml_flashattention_sram_tiling");
      expect(cert.verificationHash.length).toBe(64); // SHA-256 hex string length
      expect(cert.masteryScore).toBeGreaterThan(0.7);
      expect(cert.totalStudyHours).toBeGreaterThan(0);
    });

    it("should issue track mastery certificate for DSA track", () => {
      const state = createInitialProgressState();
      const cert = issueTrackCertificate("dsa", studentName, state, {
        customIssueTimestamp: 1700000000000,
      });

      expect(cert.certificateId).toContain("CERT-TRACK-DSA");
      expect(cert.certificateType).toBe("track_mastery");
      expect(cert.title).toContain("DSA Track Master");
      expect(cert.verificationHash.length).toBe(64);
    });

    it("should issue specialization credential for Transformer & Attention Architect", () => {
      const state = createInitialProgressState();
      const cert = issueSpecializationCertificate("cred_ml_llm_attention", studentName, state, {
        customIssueTimestamp: 1700000000000,
      });

      expect(cert.certificateId).toContain("CERT-SPEC");
      expect(cert.certificateType).toBe("specialization_credential");
      expect(cert.title).toContain("Transformer & Attention");
      expect(cert.verificationHash.length).toBe(64);
    });
  });

  describe("2. Cryptographic SHA-256 Verification & Tamper Detection", () => {
    it("authentic certificate should pass cryptographic verification", () => {
      const state = createInitialProgressState();
      const cert = issueCourseCertificate("dsa_graph_flows_and_cuts", studentName, state, {
        customIssueTimestamp: 1700000000000,
      });

      const verification = verifyCertificateHash(cert);

      expect(verification.isValid).toBe(true);
      expect(verification.expectedHash).toBe(cert.verificationHash);
      expect(verification.message).toContain("authentic");
    });

    it("tampered student name should fail verification", () => {
      const state = createInitialProgressState();
      const cert = issueCourseCertificate("dsa_graph_flows_and_cuts", studentName, state, {
        customIssueTimestamp: 1700000000000,
      });

      const tamperedCert = {
        ...cert,
        studentName: "Adversary Attacker",
      };

      const verification = verifyCertificateHash(tamperedCert);

      expect(verification.isValid).toBe(false);
      expect(verification.expectedHash).not.toBe(tamperedCert.verificationHash);
      expect(verification.message).toContain("Signature mismatch");
    });

    it("tampered mastery score should fail verification", () => {
      const state = createInitialProgressState();
      const cert = issueCourseCertificate("dsa_graph_flows_and_cuts", studentName, state, {
        customIssueTimestamp: 1700000000000,
      });

      const tamperedCert = {
        ...cert,
        masteryScore: 1.0, // altered from original
      };

      const verification = verifyCertificateHash(tamperedCert);

      expect(verification.isValid).toBe(false);
    });
  });

  describe("3. SVG Certificate Artwork & Academic Transcript Generation", () => {
    it("generateCertificateSVG should produce valid SVG containing all credential metadata", () => {
      const state = createInitialProgressState();
      const cert = issueCourseCertificate("ml_flashattention_sram_tiling", studentName, state, {
        customIssueTimestamp: 1700000000000,
      });

      const svg = generateCertificateSVG(cert);

      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
      expect(svg).toContain(studentName);
      expect(svg).toContain(cert.certificateId);
      expect(svg).toContain(cert.verificationHash);
      expect(svg.toLowerCase()).toContain("dsa & ml systems masterclass academy");
    });

    it("generateTranscriptText should produce markdown transcript detailing metrics", () => {
      const state = createInitialProgressState();
      const cert = issueCourseCertificate("ml_flashattention_sram_tiling", studentName, state, {
        customIssueTimestamp: 1700000000000,
      });

      const transcript = generateTranscriptText(cert, state);

      expect(transcript).toContain("# 📜 Academic Transcript");
      expect(transcript).toContain(studentName);
      expect(transcript).toContain(cert.certificateId);
      expect(transcript).toContain("Cryptographic Integrity Verification");
      expect(transcript).toContain(cert.verificationHash);
    });
  });
});

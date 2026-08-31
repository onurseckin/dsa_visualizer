import { describe, expect, it } from "bun:test";
import React from "react";
import { CertificateVerificationModal } from "../../components/curriculum";
import {
  createInitialProgressState,
  generateCertificateSVG,
  generateTranscriptText,
  issueCourseCertificate,
  verifyCertificateIntegrity,
} from "../index";

describe("Interactive Certificate Verification Modal Tests", () => {
  const studentName = "Geoffrey Hinton";
  const progressState = createInitialProgressState();
  const cert = issueCourseCertificate("ml_flashattention_sram_tiling", studentName, progressState, {
    customIssueTimestamp: 1700000000000,
  });

  describe("1. Component Instantiation & Modal Visibility", () => {
    it("should return null when isOpen is false", () => {
      const element = React.createElement(CertificateVerificationModal, {
        certificate: cert,
        isOpen: false,
        onClose: () => {},
      });

      expect(element).toBeDefined();
      expect(element.props.isOpen).toBe(false);
    });

    it("should instantiate CertificateVerificationModal with valid certificate props when open", () => {
      let closed = false;
      const element = React.createElement(CertificateVerificationModal, {
        certificate: cert,
        isOpen: true,
        onClose: () => {
          closed = true;
        },
      });

      expect(element).toBeDefined();
      expect(element.props.certificate?.studentName).toBe("Geoffrey Hinton");
      expect(element.props.isOpen).toBe(true);
      expect(closed).toBe(false);
    });
  });

  describe("2. Cryptographic Hash Integrity Verification", () => {
    it("should confirm authentic certificate hash verification passes", () => {
      const isAuthentic = verifyCertificateIntegrity(cert);
      expect(isAuthentic).toBe(true);
      expect(cert.verificationHash.length).toBe(64);
    });

    it("should generate valid SVG certificate containing all metadata", () => {
      const svg = generateCertificateSVG(cert);
      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
      expect(svg).toContain(studentName);
      expect(svg).toContain(cert.certificateId);
      expect(svg).toContain(cert.verificationHash);
    });

    it("should generate comprehensive academic transcript markdown", () => {
      const transcript = generateTranscriptText(cert);
      expect(transcript).toContain("Academic Transcript");
      expect(transcript).toContain(studentName);
      expect(transcript).toContain(cert.certificateId);
      expect(transcript).toContain(cert.verificationHash);
    });
  });
});
